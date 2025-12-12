/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { reduce } from 'lodash';

import type { MailAttachmentParts, MailMessage } from '../types';

export const retrieveAttachmentsFromMail = (
	original: MailMessage,
	disposition: string
): Array<MailAttachmentParts> =>
	reduce(
		original?.parts?.[0]?.parts ?? [],
		(acc, part) =>
			part.disposition && part.disposition === disposition
				? [
						...acc,
						{
							part: part.name,
							mid: original.id
						}
					]
				: acc,
		[] as Array<MailAttachmentParts>
	);
