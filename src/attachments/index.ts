/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { forEach, isArray } from 'lodash';

import { extractContentIdsFromHtml, removeAngleBrackets } from '../commons/content-id-utils';
import { MailMessage, MailMessagePart } from '../types';

/**
 * Determines if an attachment part should be ignored and not included in the attachments list.
 * Ignores Apple-specific formats, body parts, and calendar invites without filenames.
 *
 * @param item - The attachment part to check
 * @returns True if the attachment should be ignored
 */
const isIgnoredAttachment = (item: MailMessagePart): boolean => {
	// Ignore Apple-specific attachment formats
	if (
		item.contentType === 'multipart/appledouble' ||
		item.contentType === 'application/applefile'
	) {
		return true;
	}
	if (item.contentType === 'application/pkcs7-signature') {
		return true;
	}
	// Ignore HTML/plain text body parts
	if (item.body && (item.contentType === 'text/html' || item.contentType === 'text/plain')) {
		return true;
	}
	// Ignore multipart/digest containers
	if (item.contentType === 'multipart/digest') {
		return true;
	}
	// Ignore text-body markers
	if (item.ci === 'text-body') {
		return true;
	}
	// Ignore calendar invites without filenames (they're typically embedded)
	return item.contentType === 'text/calendar' && !item.filename;
};

/**
 * Recursively examines multipart structure and extracts all Content-IDs
 * referenced in HTML body parts.
 *
 * @param multipart - The multipart structure to examine
 * @returns Array of Content-IDs found in HTML content
 */
const getAttachmentsAnchoredOnHtmlBody = (
	multipart: Array<MailMessagePart> | MailMessagePart
): Array<string> => {
	const result: Array<string> = [];

	const extractFromParts = (parts: Array<MailMessagePart> | MailMessagePart): void => {
		forEach(parts, (part: MailMessagePart) => {
			if (part.parts) {
				extractFromParts(part.parts);
			}
			if (part.content) {
				result.push(...extractContentIdsFromHtml(part.content));
			}
		});
	};

	extractFromParts(multipart);
	return result;
};
/**
 * Recursively checks if a multipart structure contains any HTML content.
 * Used to determine if CID lookup is reliable for distinguishing inline vs attachment disposition.
 *
 * @param parts - Multipart structure to check
 * @returns True if HTML content is found anywhere in the structure
 */
const hasHtmlContent = (parts: Array<MailMessagePart> | MailMessagePart): boolean => {
	if (isArray(parts)) {
		return parts.some((part) => hasHtmlContent(part));
	}
	if (parts.contentType === 'text/html' && parts.body) {
		return true;
	}
	if (parts.parts) {
		return hasHtmlContent(parts.parts);
	}
	return false;
};

// TODO: avoid recursion for certain parts (e.g.: eml)
function flattenParts(obj: { parts: MailMessagePart['parts'] }): Array<MailMessagePart> {
	return (obj.parts || []).flatMap(({ parts, ...rest }) => [
		rest,
		...(parts ? flattenParts({ parts }) : [])
	]);
}
/**
 * Extracts and normalizes attachments from SOAP message parts.
 * Handles proper classification of inline vs regular attachments based on Content-ID references in HTML.
 *
 * Key behaviors:
 * - Items with Content-IDs referenced in HTML body are marked as 'inline'
 * - Items with Content-IDs NOT referenced (but marked inline) are changed to 'attachment'
 * - Filters out body parts, Apple formats, and PKCS7 signatures
 * - Adds normalized properties (contentType, name, size)
 *
 * @param mailPart - SOAP mail parts structure (can be array or single part)
 * @returns Array of normalized attachment parts
 */
const getAttachmentsFromParts = (mailPart: Array<MailMessagePart>): Attachments => {
	const anchoredAttachmentsList = getAttachmentsAnchoredOnHtmlBody(mailPart);
	const mailHasHtmlBody = hasHtmlContent(mailPart);
	const results: Attachments = {
		inlineAttachments: [],
		blockAttachments: []
	};

	if (!mailPart) {
		return results;
	}

	const attachmentParts = flattenParts({ parts: mailPart });
	forEach(attachmentParts, (attachmentPart) => {
		if (!isIgnoredAttachment(attachmentPart)) {
			const item = {
				...attachmentPart,
				contentType: attachmentPart.contentType,
				name: attachmentPart?.name,
				size: attachmentPart?.size
			};
			if (
				(item.cd && item.cd === 'attachment') ||
				(item.contentType &&
					(item.contentType === 'message/rfc822' || item.contentType === 'text/calendar')) ||
				item.filename ||
				item.ci
			) {
				// Determine content disposition based on whether it's referenced in HTML body
				if (item.ci && anchoredAttachmentsList.includes(removeAngleBrackets(item.ci))) {
					results.inlineAttachments.push(item);
				} else if (item.ci && item.cd === 'inline') {
					mailHasHtmlBody
						? results.blockAttachments.push(item)
						: results.inlineAttachments.push(item);
					// Not referenced in HTML but marked inline -> change to attachment
					// TODO: double check this condition
				} else if (item.cd === 'inline' && item.filename && mailHasHtmlBody) {
					results.blockAttachments.push(item);
				} else if (item.contentType === 'message/rfc822' && !item.filename) {
					item.filename = 'Unknown <message/rfc822>';
					results.blockAttachments.push(item);
				} else if (item.contentType === 'text/html' && !item.filename) {
					item.filename = 'Unknown <text/html>';
					results.blockAttachments.push(item);
				} else {
					results.blockAttachments.push(item);
				}
			}
		}
	});

	return results;
};

type Attachments = {
	inlineAttachments: Array<MailMessagePart>;
	blockAttachments: Array<MailMessagePart>;
};

export const retrieveAttachmentsFromMail = (msg: MailMessage): Attachments =>
	getAttachmentsFromParts(msg.parts);
