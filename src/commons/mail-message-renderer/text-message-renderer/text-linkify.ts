/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Autolinker from 'autolinker';
import { AutolinkerConfig } from 'autolinker/dist/commonjs/autolinker';
import { escape as escapeHtml } from 'lodash';

export type LinkifyOptions = {
	autolinker?: Partial<AutolinkerConfig> | false;
	anchorRel?: string;
	openInNewTab?: boolean;
	linkEmails?: boolean;
};

const DEFAULT_OPTIONS: Required<Omit<LinkifyOptions, 'autolinker'>> & {
	autolinker: Partial<AutolinkerConfig>;
} = {
	autolinker: {
		urls: { schemeMatches: true, tldMatches: true, ipV4Matches: false },
		email: false,
		phone: true,
		newWindow: true,
		stripPrefix: false,
		stripTrailingSlash: false
	},
	anchorRel: 'noopener noreferrer',
	openInNewTab: true,
	linkEmails: true
};

// The query part allows '&' (to separate parameters) but stops at an escaped angle
// bracket (&lt; / &gt;) so a bracketed <mailto:...> does not swallow its closing
// bracket once the surrounding text has been HTML-escaped.
const MAILTO_EMAIL_REGEX =
	/mailto:([\p{L}\p{N}._%+-]+@(?:[\p{L}\p{N}.-]+\.[\p{L}\p{N}]{2,}|\[[^\]\s<>]+\]))(\?(?:(?!&lt;|&gt;)[^\s<>])+)?/gu;

const PLAIN_EMAIL_REGEX =
	/(^|\s)([\p{L}\p{N}._%+-]+@(?:[\p{L}\p{N}.-]+\.[\p{L}\p{N}]{2,}|\[[^\]\s<>]+\]))/gu;

// NOTE: angle brackets are HTML-escaped (via lodash `escape`) before this runs, so we
// match the escaped entities &lt; ... &gt; rather than literal < ... >.
const ANGLE_BRACKET_EMAIL_REGEX =
	/&lt;([a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z0-9-]{2,}|\[[^\]\s<>]+])&gt;/g;

function asAttrs(opts: Required<LinkifyOptions>): string {
	const target = opts.openInNewTab ? ' target="_blank"' : '';
	const rel = opts.anchorRel ? ` rel="${opts.anchorRel}"` : '';
	return `${target}${rel}`;
}

/**
 * Converts raw text to HTML with linkified URLs, email addresses, MailTo, and Tel links.
 *  If `options.autolinker === false`, only the email/mailto handling runs.
 *
 * @param rawText - The input text containing URLs and email addresses, Telephone numbers.
 * @param options - Optional configuration for linkification.
 * @returns The HTML string with linkified content.
 */
export function linkifyText(rawText: string, options?: LinkifyOptions): string {
	const opts = {
		...DEFAULT_OPTIONS,
		...options,
		autolinker:
			options && 'autolinker' in options && options.autolinker === false
				? false
				: {
						...DEFAULT_OPTIONS.autolinker,
						...(options?.autolinker as Partial<AutolinkerConfig> | undefined)
					}
	} as Required<Omit<LinkifyOptions, 'autolinker'>> & {
		autolinker: Partial<AutolinkerConfig> | false;
	};

	const attrs = asAttrs(opts);

	// Escape untrusted content up-front with lodash `escape` (handles & < > " '): the result
	// is rendered via dangerouslySetInnerHTML, so it must not be able to inject markup
	// (escaped < >) nor break out of the href="..." attributes of the anchors we build
	// (escaped "). All anchors below are added after this point and are therefore unaffected.
	let processedText = escapeHtml(rawText);

	if (opts.linkEmails) {
		// Re-create mailto anchors
		processedText = processedText.replace(MAILTO_EMAIL_REGEX, (match, email, query) => {
			const href = `mailto:${email}${query ?? ''}`;
			return `<a href="${href}"${attrs}>${match}</a>`;
		});

		// Plain emails (not already mailto) → anchors
		processedText = processedText.replace(
			PLAIN_EMAIL_REGEX,
			(_m, ws, email) => `${ws}<a href="mailto:${email}"${attrs}>${email}</a>`
		);

		// Angle-bracketed emails → anchors but keep literal &lt; &gt;
		processedText = processedText.replace(
			ANGLE_BRACKET_EMAIL_REGEX,
			(_m, email) => `&lt;<a href="mailto:${email}"${attrs}>${email}</a>&gt;`
		);
	}

	if (opts.autolinker === false) {
		return processedText;
	}

	return Autolinker.link(processedText, {
		...opts.autolinker,
		newWindow: opts.openInNewTab
	});
}
