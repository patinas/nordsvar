//! Deterministic chunking. Two levels: `chunk_text` splits on paragraph
//! boundaries with bounded overlap; `chunk_markdown` first splits by
//! headings so retrieval context carries its section path.

use serde::Serialize;

/// A chunk of a source document ready for embedding and indexing.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Chunk {
    /// Ordinal position of the chunk within its source document.
    pub ordinal: u32,
    /// Raw text of the chunk (with section prefix for Markdown).
    pub text: String,
}

/// Split text into roughly `target_chars`-sized chunks on paragraph
/// boundaries, with a small overlap so retrieval context is not cut
/// mid-thought. A single paragraph longer than the target becomes its own
/// chunk rather than being split mid-word.
pub fn chunk_text(text: &str, target_chars: usize, overlap_chars: usize) -> Vec<Chunk> {
    let target = target_chars.max(1);
    let mut chunks = Vec::new();
    let mut current = String::new();
    let mut ordinal = 0u32;

    for paragraph in text.split("\n\n") {
        let paragraph = paragraph.trim();
        if paragraph.is_empty() {
            continue;
        }
        if !current.is_empty() && current.len() + paragraph.len() + 2 > target {
            push_chunk(&mut chunks, &mut ordinal, std::mem::take(&mut current));
            if overlap_chars > 0 {
                current = tail_of(
                    chunks.last().expect("just pushed").text.as_str(),
                    overlap_chars,
                );
            }
        }
        if !current.is_empty() {
            current.push_str("\n\n");
        }
        current.push_str(paragraph);
    }
    if !current.trim().is_empty() {
        push_chunk(&mut chunks, &mut ordinal, current);
    }
    chunks
}

/// Last `n` chars of `s` on a character boundary.
fn tail_of(s: &str, n: usize) -> String {
    let mut start = s.len().saturating_sub(n);
    while !s.is_char_boundary(start) {
        start += 1;
    }
    s[start..].to_string()
}

fn push_chunk(chunks: &mut Vec<Chunk>, ordinal: &mut u32, text: String) {
    let text = text.trim().to_string();
    if text.is_empty() {
        return;
    }
    chunks.push(Chunk {
        ordinal: *ordinal,
        text,
    });
    *ordinal += 1;
}

/// Split Markdown into sections by ATX headings, then chunk each section.
/// Every chunk is prefixed with its heading path so an embedding of the
/// chunk still carries where in the runbook it lives.
pub fn chunk_markdown(markdown: &str, target_chars: usize, overlap_chars: usize) -> Vec<Chunk> {
    let mut sections: Vec<(String, String)> = Vec::new();
    let mut heading_stack: Vec<(usize, String)> = Vec::new();
    let mut current_body = String::new();

    for line in markdown.lines() {
        let heading = parse_atx_heading(line);
        if let Some((level, title)) = heading {
            if !current_body.trim().is_empty() {
                sections.push((
                    heading_path(&heading_stack),
                    std::mem::take(&mut current_body),
                ));
            }
            while heading_stack.last().is_some_and(|(l, _)| *l >= level) {
                heading_stack.pop();
            }
            heading_stack.push((level, title));
        } else {
            current_body.push_str(line);
            current_body.push('\n');
        }
    }
    if !current_body.trim().is_empty() {
        sections.push((heading_path(&heading_stack), current_body));
    }

    let mut chunks = Vec::new();
    let mut ordinal = 0u32;
    for (path, body) in sections {
        for piece in chunk_text(&body, target_chars, overlap_chars) {
            let text = if path.is_empty() {
                piece.text
            } else {
                format!("{path}\n\n{}", piece.text)
            };
            push_chunk(&mut chunks, &mut ordinal, text);
        }
    }
    chunks
}

fn parse_atx_heading(line: &str) -> Option<(usize, String)> {
    let trimmed = line.trim_start();
    let hashes = trimmed.chars().take_while(|c| *c == '#').count();
    if hashes == 0 || hashes > 6 {
        return None;
    }
    let rest = &trimmed[hashes..];
    if !rest.starts_with(' ') {
        return None;
    }
    let title = rest.trim().trim_end_matches('#').trim().to_string();
    if title.is_empty() {
        None
    } else {
        Some((hashes, title))
    }
}

fn heading_path(stack: &[(usize, String)]) -> String {
    stack
        .iter()
        .map(|(_, t)| t.as_str())
        .collect::<Vec<_>>()
        .join(" > ")
}

#[cfg(test)]
mod tests {
    use super::*;
    use proptest::prelude::*;

    #[test]
    fn splits_on_paragraph_boundaries() {
        let text = "alpha alpha\n\nbeta beta\n\ngamma gamma";
        let chunks = chunk_text(text, 20, 0);
        assert!(chunks.len() >= 2);
        assert_eq!(chunks[0].ordinal, 0);
        assert!(chunks.iter().any(|c| c.text.contains("beta beta")));
    }

    #[test]
    fn empty_input_yields_no_chunks() {
        assert!(chunk_text("", 100, 0).is_empty());
        assert!(chunk_text("\n\n  \n\n", 100, 0).is_empty());
    }

    #[test]
    fn overlap_carries_tail_into_next_chunk() {
        let text = "aaaaaaaaaaaaaaaaaaaa\n\nbbbbbbbbbbbbbbbbbbbb";
        let chunks = chunk_text(text, 25, 5);
        assert_eq!(chunks.len(), 2);
        assert!(chunks[1].text.starts_with("aaaaa"), "overlap tail present");
        assert!(chunks[1].text.contains("bbbbbbbbbbbbbbbbbbbb"));
    }

    #[test]
    fn oversized_paragraph_becomes_its_own_chunk() {
        let text = format!("{}\n\nshort", "x".repeat(500));
        let chunks = chunk_text(&text, 100, 0);
        assert_eq!(chunks.len(), 2);
        assert_eq!(chunks[0].text.len(), 500);
    }

    #[test]
    fn markdown_sections_carry_heading_path() {
        let md = "# Netværk\n\nVPN-problemer.\n\n## Split-tunnel\n\nAktiver split-tunnel.\n\n# Printer\n\nGenstart spooleren.";
        let chunks = chunk_markdown(md, 1000, 0);
        assert_eq!(chunks.len(), 3);
        assert!(chunks[0].text.starts_with("Netværk\n\n"));
        assert!(chunks[1].text.starts_with("Netværk > Split-tunnel\n\n"));
        assert!(chunks[2].text.starts_with("Printer\n\n"));
    }

    #[test]
    fn markdown_without_headings_behaves_like_plain() {
        let chunks = chunk_markdown("bare text\n\nmore text", 1000, 0);
        assert_eq!(chunks.len(), 1);
        assert!(!chunks[0].text.starts_with('>'));
    }

    proptest! {
        #[test]
        fn chunking_is_deterministic(text in "\\PC{0,2000}", target in 1usize..500, overlap in 0usize..100) {
            let a = chunk_text(&text, target, overlap);
            let b = chunk_text(&text, target, overlap);
            prop_assert_eq!(a.len(), b.len());
            for (x, y) in a.iter().zip(b.iter()) {
                prop_assert_eq!(&x.text, &y.text);
                prop_assert_eq!(x.ordinal, y.ordinal);
            }
        }

        #[test]
        fn ordinals_are_sequential(text in "\\PC{0,2000}", target in 1usize..500) {
            let chunks = chunk_text(&text, target, 0);
            for (i, c) in chunks.iter().enumerate() {
                prop_assert_eq!(c.ordinal as usize, i);
            }
        }

        #[test]
        fn no_empty_chunks(text in "\\PC{0,2000}", target in 1usize..500, overlap in 0usize..100) {
            for c in chunk_text(&text, target, overlap) {
                prop_assert!(!c.text.trim().is_empty());
            }
        }

        #[test]
        fn every_paragraph_survives_chunking(paras in proptest::collection::vec("[a-zæøå]{5,30}", 1..8)) {
            let text = paras.join("\n\n");
            let chunks = chunk_text(&text, 40, 0);
            for p in &paras {
                prop_assert!(
                    chunks.iter().any(|c| c.text.contains(p)),
                    "paragraph {p:?} lost; chunks: {:?}", chunks.iter().map(|c| &c.text).collect::<Vec<_>>()
                );
            }
        }
    }
}
