/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { generateMessage } from '../../../../../__test__/generators/generateMessage';
import { INJECTED_DESCRIPTION_DECORATOR } from '../../../../../constants';
import { MessageListItemCore } from '../message-list-item-core';
import { setupTest, screen } from '@test-setup';

describe('message list item core', () => {
	it('will show fragment when available', () => {
		const message = generateMessage({ id: '1', body: 'mail body' });
		setupTest(
			<MessageListItemCore
				message={message}
				index={0}
				onSelect={vi.fn()}
				selected={false}
				selecting={false}
				firstChildFolderId={'2'}
				isConvChildren={false}
			/>
		);

		const fragment = screen.getByTestId('Fragment');
		expect(fragment).toBeVisible();
	});
	it('will not show fragment when fragment contain injected decorator', () => {
		const message = generateMessage({ id: '1', body: INJECTED_DESCRIPTION_DECORATOR });
		setupTest(
			<MessageListItemCore
				message={message}
				index={0}
				onSelect={vi.fn()}
				selected={false}
				selecting={false}
				firstChildFolderId={'2'}
				isConvChildren={false}
			/>
		);

		const fragment = screen.queryByTestId('Fragment');
		expect(fragment).not.toBeInTheDocument();
	});
	it('will not show fragment when fragment is empty', () => {
		const message = generateMessage({ id: '1', body: '' });
		setupTest(
			<MessageListItemCore
				message={message}
				index={0}
				onSelect={vi.fn()}
				selected={false}
				selecting={false}
				firstChildFolderId={'2'}
				isConvChildren={false}
			/>
		);

		const fragment = screen.queryByTestId('Fragment');
		expect(fragment).not.toBeInTheDocument();
	});
});
