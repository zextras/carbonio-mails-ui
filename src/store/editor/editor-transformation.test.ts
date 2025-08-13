/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { composeAttachMpField } from 'store/editor/editor-transformations';

describe('composeAttachMpField', () => {
	it('should correctly transform an array of SavedAttachment to an array of MailAttachmentParts', async () => {
		const savedAttachments = [
			{
				contentType: 'message/rfc822',
				size: 8539,
				isInline: false,
				filename: 'Conquista del mondo senza meeting room.eml',
				partName: '2',
				messageId: '11215'
			}
		];
		const result = composeAttachMpField(savedAttachments);

		const expectedOutput = [
			{
				mid: '11215',
				part: '2'
			}
		];
		expect(result).toEqual(expectedOutput);
	});
});
