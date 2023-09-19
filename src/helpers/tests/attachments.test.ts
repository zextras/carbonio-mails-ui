/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getMsgCall } from '../../store/actions';
import { getAttachmentParts, isContentIdEqual } from '../attachments';

describe('attachments', () => {
	describe('getAttachmentParts', () => {
		test('Inline attachment without content disposition are recognized anyway', async () => {
			const msg = await getMsgCall({ msgId: '13' });
			const attachmentParts = getAttachmentParts(msg);
			expect(attachmentParts).toHaveLength(1);
			expect(attachmentParts[0].name).toBe('2');
			expect(attachmentParts[0].disposition).toBe('inline');
			expect(attachmentParts[0].filename).toBe('image001.jpg');
			expect(attachmentParts[0].ci).toBe('<image001.jpg@01D9CB62.1AADEDA0>');
		});
	});

	describe('isContentEqual', () => {
		test('return true if the strings are exactly the same', () => {
			const contentId = 'cid:cd2cf820-9642-433c-a2f1-23b0175254cd@carbonio';
			const otherContentID = 'cid:cd2cf820-9642-433c-a2f1-23b0175254cd@carbonio';
			expect(isContentIdEqual(contentId, otherContentID)).toBe(true);
		});

		test('return true if the content inside the angle brackets of the first param is the same as the other', () => {
			const contentId = '<cid:cd2cf820-9642-433c-a2f1-23b0175254cd@carbonio>';
			const otherContentID = 'cid:cd2cf820-9642-433c-a2f1-23b0175254cd@carbonio';
			expect(isContentIdEqual(contentId, otherContentID)).toBe(true);
		});

		test('return true if the content inside the angle brackets of the second param is the same as the other', () => {
			const contentId = 'cid:cd2cf820-9642-433c-a2f1-23b0175254cd@carbonio';
			const otherContentID = '<cid:cd2cf820-9642-433c-a2f1-23b0175254cd@carbonio>';
			expect(isContentIdEqual(contentId, otherContentID)).toBe(true);
		});

		test('return false if the content is not the same', () => {
			const contentId = 'cid:fffffff-ffff-ffff-ffff-23b0175254cd@carbonio';
			const otherContentID = '<cid:cd2cf820-9642-433c-a2f1-23b0175254cd@carbonio>';
			expect(isContentIdEqual(contentId, otherContentID)).toBe(false);
		});
	});
});
