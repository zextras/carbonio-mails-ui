/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getMsgCall } from '../../store/actions';
import { getAttachmentParts } from '../attachments';

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
