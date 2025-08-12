/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Autolinker from 'autolinker';
import { AutolinkerConfig } from 'autolinker/dist/commonjs/autolinker';

export type LinkifyOptions = {
	autolinker?: Partial<AutolinkerConfig>;
	anchorRel?: string;
	openInNewTab?: boolean;
};

const DEFAULT_OPTIONS: Required<LinkifyOptions> = {
	autolinker: {
		urls: { schemeMatches: true, tldMatches: true, ipV4Matches: false },
		email: false,
		newWindow: true,
		stripPrefix: false,
		stripTrailingSlash: false
	},
	anchorRel: 'noopener noreferrer',
	openInNewTab: true
};

const MAILTO_EMAIL_REGEX = /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(\?[^\s<>]+)?/g;

const PLAIN_EMAIL_REGEX = /(^|\s)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

const ANGLE_BRACKET_EMAIL_REGEX = /<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/g;

function asAttrs(opts: Required<LinkifyOptions>): string {
	const target = opts.openInNewTab ? ' target="_blank"' : '';
	const rel = opts.anchorRel ? ` rel="${opts.anchorRel}"` : '';
	return `${target}${rel}`;
}

/**
 * Convert raw text → safe HTML with:
 * - mailto:foo@bar with query preserved
 * - plain emails to mailto anchors
 * - <foo@bar> into &lt;<a ...>foo@bar</a>&gt;
 * - URLs via Autolinker
 */
export function linkifyToHtml(rawText: string, options?: LinkifyOptions): string {
	const opts = { ...DEFAULT_OPTIONS, ...options };
	const attrs = asAttrs(opts);

	// Re-create mailto anchors
	const withMailto = rawText.replace(MAILTO_EMAIL_REGEX, (match, email, query) => {
		const href = `mailto:${email}${query ?? ''}`;
		return `<a href="${href}"${attrs}>${match}</a>`;
	});

	// Plain emails (not already mailto) → anchors
	const withPlainEmailAnchors = withMailto.replace(
		PLAIN_EMAIL_REGEX,
		(_m, ws, email) => `${ws}<a href="mailto:${email}"${attrs}>${email}</a>`
	);

	// Angle-bracketed emails → anchors but keep literal &lt; &gt;
	const withAngleBracketEmails = withPlainEmailAnchors.replace(
		ANGLE_BRACKET_EMAIL_REGEX,
		(_m, email) => `&lt;<a href="mailto:${email}"${attrs}>${email}</a>&gt;`
	);

	return Autolinker.link(withAngleBracketEmails, {
		...opts.autolinker,
		newWindow: opts.openInNewTab
	});
}
