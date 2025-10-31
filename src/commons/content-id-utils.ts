/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Utilities for handling Content-ID (CID) references in email messages.
 * Content-IDs are used to reference embedded resources (like images) within HTML email bodies.
 *
 * RFC 2392 defines the cid: URL scheme for referencing MIME body parts by their Content-ID.
 * @see https://www.ietf.org/rfc/rfc2392.txt
 */

/**
 * Decodes HTML entities in a string to their actual characters.
 * Handles common entities like &#64; (@), &#39; ('), &amp; (&), etc.
 *
 * @param encodedString - String potentially containing HTML entities
 * @returns Decoded string with entities converted to actual characters
 *
 * @example
 * decodeHtmlEntities('image&#64;domain.com') // returns 'image@domain.com'
 * decodeHtmlEntities('test&amp;data') // returns 'test&data'
 */
export const decodeHtmlEntities = (encodedString: string): string => {
	try {
		const doc = new DOMParser().parseFromString(
			`<!DOCTYPE html><html><body>${encodedString}</body></html>`,
			'text/html'
		);
		const decodedText = doc.body.textContent;
		if (decodedText) {
			return decodedText;
		}
	} catch {
		// DOMParser failed, fall through to manual decoding
	}

	// Fallback: manually decode common HTML entities
	return encodedString
		.replace(/&#64;/g, '@')
		.replace(/&#39;/g, "'")
		.replace(/&#34;/g, '"')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>');
};

/**
 * Removes angle brackets from a Content-ID string.
 * Content-IDs in email headers are often wrapped in angle brackets (e.g., <image@domain.com>).
 *
 * @param contentId - Content-ID string potentially wrapped in angle brackets
 * @returns Content-ID without angle brackets
 *
 * @example
 * removeAngleBrackets('<image@domain.com>') // returns 'image@domain.com'
 * removeAngleBrackets('image@domain.com') // returns 'image@domain.com'
 */
export const removeAngleBrackets = (contentId: string): string => contentId.replace(/^<|>$/g, '');

/**
 * Extracts Content-IDs from HTML content.
 * Searches for cid: URL references and extracts the Content-ID portion.
 * Handles HTML entity encoding (e.g., &#64; for @) properly.
 *
 * This function is used to identify which attachments are referenced/embedded in the HTML body.
 *
 * @param htmlContent - HTML content to search for CID references
 * @returns Array of Content-IDs found in the HTML (without 'cid:' prefix and decoded)
 *
 * @example
 * // HTML with entity-encoded CID
 * extractContentIdsFromHtml('<img src="cid:logo&#64;company.com">')
 * // returns ['logo@company.com']
 *
 * @example
 * // Multiple CIDs
 * extractContentIdsFromHtml('<img src="cid:img1@test.com"> <img src="cid:img2@test.com">')
 * // returns ['img1@test.com', 'img2@test.com']
 */
export const extractContentIdsFromHtml = (htmlContent: string): Array<string> => {
	// Match cid: followed by anything until quote, whitespace, or >
	// This pattern handles various HTML formats and attributes
	const cidPattern = /cid:([^"\s>]+)/g;
	const matches = htmlContent.match(cidPattern);

	if (!matches) {
		return [];
	}

	return matches.map((match) => {
		const cidWithEntities = match.replace('cid:', '');
		return decodeHtmlEntities(cidWithEntities);
	});
};

/**
 * Compares two Content-ID strings for equality, ignoring angle brackets.
 *
 * @param contentId - First Content-ID to compare
 * @param otherContentId - Second Content-ID to compare
 * @returns True if the Content-IDs are equal (after removing angle brackets)
 *
 * @example
 * areContentIdsEqual('<image@test.com>', 'image@test.com') // returns true
 * areContentIdsEqual('image@test.com', 'image@test.com') // returns true
 * areContentIdsEqual('img1@test.com', 'img2@test.com') // returns false
 */
export const areContentIdsEqual = (contentId: string, otherContentId: string): boolean => {
	const cleanedId = removeAngleBrackets(contentId);
	const cleanedOtherId = removeAngleBrackets(otherContentId);
	return cleanedId === cleanedOtherId;
};
