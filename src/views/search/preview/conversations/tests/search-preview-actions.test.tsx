/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { API_REQUEST_STATUS, MessageActionsDescriptors } from '../../../../../constants';
import {
	setSearchResultsByConversation,
	updateConversationStatus
} from '../../../../../store/zustand/search/store';
import { generateConversation } from '../../../../../tests/generators/generateConversation';
import { generateStore } from '../../../../../tests/generators/store';
import { ExtraWindowCreationParams, ExtraWindowsCreationResult } from '../../../../../types';
import { previewConversationOnSeparatedWindowAction } from '../search-conversation-preview-actions';

const TestComponent: FC = ({ children }) => <div>{children}</div>;
describe('Preview conversation on new window', () => {
	it('should call create window with correct parameters', () => {
		setSearchResultsByConversation([generateConversation({ id: '1' })], false);
		let spyParams: Partial<ExtraWindowCreationParams> = {};
		const spyCreateWindow = (props: ExtraWindowCreationParams): ExtraWindowsCreationResult => {
			spyParams = props;
			return { id: '1' };
		};

		previewConversationOnSeparatedWindowAction('1', 'Test subject', spyCreateWindow).onClick();

		expect(spyParams.name).toBe('conversation-1');
		expect(spyParams.title).toBe('Test subject');
		expect(spyParams.closeOnUnmount).toBe(false);
		expect(spyParams.returnComponent).toBe(false);
		// NOTE: we can also test the UI by using spyParams.children
	});

	it('should render message on a detail panel', async () => {
		setSearchResultsByConversation([generateConversation({ id: '1', messages: [] })], false);
		updateConversationStatus('1', API_REQUEST_STATUS.fulfilled);
		let spyParams: Partial<ExtraWindowCreationParams> = {};
		const spyCreateWindow = (props: ExtraWindowCreationParams): ExtraWindowsCreationResult => {
			spyParams = props;
			return { id: '1' };
		};
		const store = generateStore({});

		previewConversationOnSeparatedWindowAction('1', 'Test subject', spyCreateWindow).onClick();

		// eslint-disable-next-line testing-library/no-node-access
		setupTest(<TestComponent>{spyParams.children}</TestComponent>, { store });
		expect(await screen.findByTestId('ConversationPreview-1')).toBeVisible();
	});

	it('should return an action with id "preview on separate window"', () => {
		const result = previewConversationOnSeparatedWindowAction('1', '', jest.fn());

		expect(result.id).toBe(MessageActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW.id);
	});

	it('should call create window when calling onClick', () => {
		const createWindow = jest.fn();
		const result = previewConversationOnSeparatedWindowAction('1', '', createWindow);

		result.onClick();

		expect(createWindow).toBeCalledTimes(1);
	});
});
