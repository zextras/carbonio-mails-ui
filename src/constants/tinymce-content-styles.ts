/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Base content styles for TinyMCE editor and email body formatting.
 * Optimized for email client compatibility (Gmail, Outlook, Apple Mail, etc.)
 */
export const TINYMCE_BASE_CONTENT_STYLES = `
	/* Paragraphs */
	p {
		margin: 0;
		padding: 0;
		margin-bottom: 16px;
	}
	p:last-child {
		margin-bottom: 0;
	}
	
	/* Headings */
	h1, h2, h3, h4, h5, h6 {
		margin-top: 0;
		margin-bottom: 16px;
		font-weight: bold;
		line-height: 1.3;
	}
	h1 { font-size: 24px; }
	h2 { font-size: 20px; }
	h3 { font-size: 18px; }
	h4 { font-size: 16px; }
	h5 { font-size: 14px; }
	h6 { font-size: 12px; }
	
	/* Tables */
	table {
		border-collapse: collapse;
		border-spacing: 0;
		width: 100%;
		max-width: 100%;
		background-color: transparent;
	}
	table td,
	table th {
		padding: 8px;
		vertical-align: top;
	}
	table td:not([style*="border"]),
	table th:not([style*="border"]) {
		border: 1px solid #cccccc;
	}
	table th {
		font-weight: bold;
		text-align: left;
	}
	table th:not([style*="background"]) {
		background-color: #f5f5f5;
	}
	table[border="1"] td:not([style*="border"]),
	table[border="1"] th:not([style*="border"]) {
		border: 1px solid #cccccc;
	}
	table[border="0"] td,
	table[border="0"] th {
		border: none;
	}
	
	/* Table captions */
	caption {
		padding: 8px;
		caption-side: top;
		margin-bottom: 8px;
	}
	caption[align="bottom"] {
		caption-side: bottom;
		margin-bottom: 0;
		margin-top: 8px;
	}
	
	/* Lists */
	ul, ol {
		margin: 0 0 16px 0;
		padding: 0 0 0 40px;
	}
	li {
		margin-bottom: 4px;
	}
	
	/* Links */
	a[href] {
		color: #2b73d2;
		text-decoration: underline;
	}
	a[href]:hover {
		color: #1e5092;
		text-decoration: underline;
	}
	a[href]:visited {
		color: #1e5092;
	}
	
	/* Images */
	img {
		border: 0;
		outline: none;
		text-decoration: none;
		display: block;
	}
	
	/* Horizontal rules */
	hr {
		border: 0;
		border-top: 1px solid #cccccc;
		margin: 16px 0;
		height: 0;
	}
	
	/* Code blocks */
	code {
		background-color: #f5f5f5;
		padding: 2px 4px;
		font-family: 'Courier New', Courier, monospace;
		font-size: 90%;
		border: 1px solid #e0e0e0;
	}
	pre {
		background-color: #f5f5f5;
		padding: 12px;
		border: 1px solid #e0e0e0;
		overflow-x: auto;
		margin: 16px 0;
		font-family: 'Courier New', Courier, monospace;
		font-size: 13px;
		line-height: 1.4;
	}
	pre code {
		background-color: transparent;
		padding: 0;
		border: none;
	}
	
	/* Blockquotes */
	blockquote {
		border-left: 3px solid #cccccc;
		margin: 16px 0;
		padding: 8px 0 8px 16px;
	}
	blockquote[dir="rtl"] {
		border-left: none;
		border-right: 3px solid #cccccc;
		padding: 8px 16px 8px 0;
	}
	.mce-content-body:not([dir=rtl]) blockquote {
		border-left: 3px solid #cccccc;
		margin: 16px 0;
		padding: 8px 0 8px 16px;
	}
	.mce-content-body[dir=rtl] blockquote {
		border-right: 3px solid #cccccc;
		border-left: none;
		margin: 16px 0;
		padding: 8px 16px 8px 0;
	}
	
	/* Text formatting */
	strong, b {
		font-weight: bold;
	}
	em, i {
		font-style: italic;
	}
	u {
		text-decoration: underline;
	}
	s, strike, del {
		text-decoration: line-through;
	}
	sub {
		font-size: 75%;
		line-height: 0;
		position: relative;
		vertical-align: baseline;
		bottom: -0.25em;
	}
	sup {
		font-size: 75%;
		line-height: 0;
		position: relative;
		vertical-align: baseline;
		top: -0.5em;
	}
	
	/* Divs */
	div {
		margin: 0;
		padding: 0;
	}
`;
