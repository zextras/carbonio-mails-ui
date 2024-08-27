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
	setSearchResultsByMessage,
	updateMessageStatus
} from '../../../../../store/zustand/search/store';
import { generateMessage } from '../../../../../tests/generators/generateMessage';
import { generateStore } from '../../../../../tests/generators/store';
import { ExtraWindowCreationParams, ExtraWindowsCreationResult } from '../../../../../types';
import {
	previewMessageOnSeparatedWindow,
	previewMessageOnSeparatedWindowAction
} from '../search-messages-preview-actions';

const TestComponent: FC = ({ children }) => <div>{children}</div>;
describe('Preview message on new window', () => {
	it('should call create window with correct parameters', () => {
		setSearchResultsByMessage([generateMessage({ id: '1' })], false);
		let spyParams: Partial<ExtraWindowCreationParams> = {};
		const spyCreateWindow = (props: ExtraWindowCreationParams): ExtraWindowsCreationResult => {
			spyParams = props;
			return { id: '1' };
		};

		previewMessageOnSeparatedWindow('1', 'Test subject', spyCreateWindow, []);

		expect(spyParams.name).toBe('message-1');
		expect(spyParams.title).toBe('Test subject');
		expect(spyParams.closeOnUnmount).toBe(false);
		expect(spyParams.returnComponent).toBe(false);
		// NOTE: we can also test the UI by using spyParams.children
	});

	it('should render message on a detail panel', async () => {
		setSearchResultsByMessage([generateMessage({ id: '1', isComplete: true })], false);
		updateMessageStatus('1', API_REQUEST_STATUS.fulfilled);
		let spyParams: Partial<ExtraWindowCreationParams> = {};
		const spyCreateWindow = (props: ExtraWindowCreationParams): ExtraWindowsCreationResult => {
			spyParams = props;
			return { id: '1' };
		};
		const store = generateStore({});

		// Should use a strict type, not any
		const primaryActions: Array<any> = [];
		const secondaryActions: Array<any> = [];
		previewMessageOnSeparatedWindow('1', 'Test subject', spyCreateWindow, [
			primaryActions,
			secondaryActions
		]);

		// eslint-disable-next-line testing-library/no-node-access
		setupTest(<TestComponent>{spyParams.children}</TestComponent>, { store });
		expect(await screen.findByTestId('MailPreview-1')).toBeVisible();
	});

	it('should return an action with id "preview on separate window"', () => {
		const result = previewMessageOnSeparatedWindowAction('1', '', jest.fn(), []);

		expect(result.id).toBe(MessageActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW.id);
	});

	it('should call create window when calling onClick', () => {
		const createWindow = jest.fn();
		const result = previewMessageOnSeparatedWindowAction('1', '', createWindow, []);

		result.onClick();

		expect(createWindow).toBeCalledTimes(1);
	});
});
