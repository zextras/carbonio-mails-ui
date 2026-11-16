/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { recordNotifiedItems, trackNotifiedItems } from 'store/emails/notified-items';

describe('notified items', () => {
	it('should record the items notified while tracked', () => {
		const { notifiedItems, stop } = trackNotifiedItems();

		recordNotifiedItems({ deletedIds: ['1'], changedIds: ['2', '3'] });
		stop();
		recordNotifiedItems({ deletedIds: ['4'], changedIds: ['5'] });

		expect(notifiedItems.deletedIds).toEqual(new Set(['1']));
		expect(notifiedItems.changedIds).toEqual(new Set(['2', '3']));
	});

	it('should record the notified items for each search in progress', () => {
		const first = trackNotifiedItems();
		recordNotifiedItems({ deletedIds: ['1'], changedIds: [] });
		const second = trackNotifiedItems();
		recordNotifiedItems({ deletedIds: ['2'], changedIds: [] });
		first.stop();
		second.stop();

		expect(first.notifiedItems.deletedIds).toEqual(new Set(['1', '2']));
		expect(second.notifiedItems.deletedIds).toEqual(new Set(['2']));
	});
});
