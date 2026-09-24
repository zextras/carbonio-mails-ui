/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-ui-commons';

import { ItemAvatar } from '../item-avatar';
import { setupTest, UserEvent } from '@test-setup';

describe('ItemAvatar', () => {
	const item = {
		id: '42',
		participants: [{ type: 'f', address: 'sender@example.com', fullName: 'Sender' }]
	};

	const renderAvatar = (
		onSelect = vi.fn()
	): { onSelect: typeof onSelect; user: UserEvent; avatar: HTMLElement } => {
		const { user } = setupTest(
			<ItemAvatar
				item={item}
				selected={false}
				selecting
				folderId={FOLDERS.INBOX}
				index={3}
				onSelect={onSelect}
			/>
		);
		return { onSelect, user, avatar: screen.getByTestId('avatar') };
	};

	/**
	 * Records whether each mousedown reaching the document had already been cancelled.
	 * React handlers run on the root container, below the document, so by the time the
	 * event gets here preventDefault has already been applied.
	 */
	const recordCancelledMouseDowns = (): { cancelled: Array<boolean>; stop: () => void } => {
		const cancelled: Array<boolean> = [];
		const listener = (event: MouseEvent): void => {
			cancelled.push(event.defaultPrevented);
		};
		document.addEventListener('mousedown', listener);
		return { cancelled, stop: (): void => document.removeEventListener('mousedown', listener) };
	};

	it('should suppress the native text selection on shift+mousedown', async () => {
		const { user, avatar } = renderAvatar();
		const { cancelled, stop } = recordCancelledMouseDowns();

		await user.keyboard('{Shift>}');
		await user.click(avatar);
		await user.keyboard('{/Shift}');
		stop();

		expect(cancelled).toEqual([true]);
	});

	it('should leave a plain mousedown alone', async () => {
		const { user, avatar } = renderAvatar();
		const { cancelled, stop } = recordCancelledMouseDowns();

		await user.click(avatar);
		stop();

		expect(cancelled).toEqual([false]);
	});

	it('should hand the modifier keys of the click through to onSelect', async () => {
		const { onSelect, user, avatar } = renderAvatar();

		await user.keyboard('{Shift>}');
		await user.click(avatar);
		await user.keyboard('{/Shift}');

		expect(onSelect).toHaveBeenCalledWith(3, '42', expect.objectContaining({ shiftKey: true }));
	});
});
