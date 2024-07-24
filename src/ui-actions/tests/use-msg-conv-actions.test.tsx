/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, ReactNode } from 'react';

import { renderHook } from '@testing-library/react-hooks';
import { FOLDERS } from '@zextras/carbonio-shell-ui';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';

import { getAppI18n } from '../../carbonio-ui-commons/test/i18n/i18n-test-factory';
import { generateConversation } from '../../tests/generators/generateConversation';
import { generateMessage } from '../../tests/generators/generateMessage';
import { generateStore } from '../../tests/generators/store';
import { useMsgConvActions } from '../use-msg-conv-actions';

describe('useMsgConvActions', () => {
	it('should return empty arrays if folderId is not available', () => {
		const message = generateMessage({});
		const messageWithoutFolderId = { ...message, parent: undefined };
		const conversation = generateConversation({
			id: '1',
			// testing conersaton without folderId
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			messages: [messageWithoutFolderId]
		});
		const conversationWithoutFolderId = { ...conversation, folderId: undefined };
		const { result } = renderHook(
			() =>
				useMsgConvActions({
					item: conversationWithoutFolderId,
					deselectAll: jest.fn(),
					messageActionsForExtraWindow: []
				}),
			{
				wrapper: ({ children }: { children: ReactNode }): ReactElement => (
					<I18nextProvider i18n={getAppI18n()}>
						<Provider store={generateStore()}>{children}</Provider>
					</I18nextProvider>
				)
			}
		);

		expect(result.current).toEqual([[], []]);
	});

	it('should return primary and secondary actions for a mail message', () => {
		const { result } = renderHook(() =>
			useMsgConvActions({
				item: {
					id: '1',
					parent: FOLDERS.INBOX
				},
				deselectAll: jest.fn(),
				messageActionsForExtraWindow: []
			})
		);

		const [primaryActions, secondaryActions] = result.current;
		expect(primaryActions).not.toEqual([]);
		expect(secondaryActions).not.toEqual([]);
	});

	it('should return primary and secondary actions for a conversation', () => {
		const { result } = renderHook(() =>
			useMsgConvActions({
				item: {
					id: '1',
					messages: [
						{
							id: '1',
							parent: FOLDERS.INBOX
						}
					]
				},
				deselectAll: jest.fn(),
				messageActionsForExtraWindow: []
			})
		);

		const [primaryActions, secondaryActions] = result.current;
		expect(primaryActions).not.toEqual([]);
		expect(secondaryActions).not.toEqual([]);
	});
});
