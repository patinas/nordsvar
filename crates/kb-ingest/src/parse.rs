//! Document parsing: bytes -> text. All parsing is local; no external
//! services. PDF uses pdf-extract (lopdf), DOCX is unzipped and its
//! word/document.xml text runs are extracted.

use serde::Serialize;
use std::io::Read;

/// Supported source document formats.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum SourceFormat {
    Pdf,
    Markdown,
    PlainText,
    Docx,
}

impl SourceFormat {
    /// Select a parser from a file name's extension.
    pub fn from_name(name: &str) -> Option<Self> {
        let ext = name.rsplit('.').next()?.to_lowercase();
        match ext.as_str() {
            "pdf" => Some(Self::Pdf),
            "md" | "markdown" => Some(Self::Markdown),
            "txt" => Some(Self::PlainText),
            "docx" => Some(Self::Docx),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParsedDocument {
    pub text: String,
}

#[derive(Debug, thiserror::Error)]
pub enum ParseError {
    #[error("PDF extraction failed: {0}")]
    Pdf(String),
    #[error("DOCX extraction failed: {0}")]
    Docx(String),
    #[error("document is not valid UTF-8 text")]
    Utf8,
}

pub fn parse_document(format: SourceFormat, bytes: &[u8]) -> Result<ParsedDocument, ParseError> {
    match format {
        SourceFormat::Markdown | SourceFormat::PlainText => {
            let text = std::str::from_utf8(bytes).map_err(|_| ParseError::Utf8)?;
            Ok(ParsedDocument {
                text: text.to_string(),
            })
        }
        SourceFormat::Pdf => parse_pdf(bytes),
        SourceFormat::Docx => parse_docx(bytes),
    }
}

fn parse_pdf(bytes: &[u8]) -> Result<ParsedDocument, ParseError> {
    let text =
        pdf_extract::extract_text_from_mem(bytes).map_err(|e| ParseError::Pdf(e.to_string()))?;
    Ok(ParsedDocument { text })
}

fn parse_docx(bytes: &[u8]) -> Result<ParsedDocument, ParseError> {
    let cursor = std::io::Cursor::new(bytes);
    let mut archive = zip::ZipArchive::new(cursor).map_err(|e| ParseError::Docx(e.to_string()))?;
    let mut xml = String::new();
    archive
        .by_name("word/document.xml")
        .map_err(|e| ParseError::Docx(format!("word/document.xml missing: {e}")))?
        .read_to_string(&mut xml)
        .map_err(|e| ParseError::Docx(e.to_string()))?;

    // Collect text runs (<w:t>) with paragraph breaks at </w:p>.
    let mut reader = quick_xml::Reader::from_str(&xml);
    reader.config_mut().trim_text(true);
    let mut text = String::new();
    let mut in_text_run = false;
    loop {
        match reader.read_event() {
            Ok(quick_xml::events::Event::Start(e)) => {
                if e.local_name().as_ref() == b"t" {
                    in_text_run = true;
                }
            }
            Ok(quick_xml::events::Event::End(e)) => match e.local_name().as_ref() {
                b"t" => in_text_run = false,
                b"p" => text.push_str("\n\n"),
                _ => {}
            },
            Ok(quick_xml::events::Event::Text(e)) if in_text_run => {
                let decoded = e
                    .unescape()
                    .map_err(|err| ParseError::Docx(err.to_string()))?;
                text.push_str(&decoded);
            }
            Ok(quick_xml::events::Event::Eof) => break,
            Err(err) => return Err(ParseError::Docx(err.to_string())),
            _ => {}
        }
    }
    Ok(ParsedDocument { text })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn format_detection_by_extension() {
        assert_eq!(
            SourceFormat::from_name("runbook.md"),
            Some(SourceFormat::Markdown)
        );
        assert_eq!(
            SourceFormat::from_name("guide.PDF"),
            Some(SourceFormat::Pdf)
        );
        assert_eq!(
            SourceFormat::from_name("notes.txt"),
            Some(SourceFormat::PlainText)
        );
        assert_eq!(
            SourceFormat::from_name("policy.docx"),
            Some(SourceFormat::Docx)
        );
        assert_eq!(SourceFormat::from_name("archive.zip"), None);
        assert_eq!(SourceFormat::from_name("noext"), None);
    }

    #[test]
    fn markdown_and_txt_are_utf8_passthrough() {
        let doc = parse_document(
            SourceFormat::Markdown,
            "# Overskrift\n\nBrødtekst æøå".as_bytes(),
        )
        .unwrap();
        assert!(doc.text.contains("æøå"));
        assert!(parse_document(SourceFormat::PlainText, &[0xff, 0xfe]).is_err());
    }

    /// Build a minimal valid .docx in memory: a zip with one XML document.
    fn minimal_docx(paragraphs: &[&str]) -> Vec<u8> {
        let mut body = String::new();
        for p in paragraphs {
            body.push_str(&format!("<w:p><w:r><w:t>{p}</w:t></w:r></w:p>"));
        }
        let document = format!(
            "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\
             <w:document xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\">\
             <w:body>{body}</w:body></w:document>"
        );
        let mut cursor = std::io::Cursor::new(Vec::new());
        {
            let mut writer = zip::ZipWriter::new(&mut cursor);
            let options: zip::write::FileOptions<()> = zip::write::FileOptions::default();
            writer.start_file("word/document.xml", options).unwrap();
            writer.write_all(document.as_bytes()).unwrap();
            writer.finish().unwrap();
        }
        cursor.into_inner()
    }

    #[test]
    fn docx_text_runs_are_extracted_with_paragraph_breaks() {
        let bytes = minimal_docx(&["Genstart printspooleren", "Genvej: services.msc"]);
        let doc = parse_document(SourceFormat::Docx, &bytes).unwrap();
        assert!(doc.text.contains("Genstart printspooleren"));
        assert!(doc.text.contains("services.msc"));
        assert!(doc.text.contains("\n\n"));
    }

    #[test]
    fn docx_rejects_non_zip() {
        assert!(parse_document(SourceFormat::Docx, b"not a zip").is_err());
    }

    #[test]
    fn pdf_fixture_extracts_text() {
        let bytes = include_bytes!("../tests/fixtures/hello.pdf");
        let doc = parse_document(SourceFormat::Pdf, bytes).unwrap();
        assert!(
            doc.text.contains("Genstart printspooleren"),
            "unexpected PDF text: {:?}",
            doc.text
        );
    }

    #[test]
    fn pdf_rejects_garbage() {
        assert!(parse_document(SourceFormat::Pdf, b"%PDF-broken").is_err());
    }
}
