/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen, waitFor, within } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { ActionsType } from '../../../../../commons/utils';
import * as useQueryParam from '../../../../../hooks/useQueryParam';
import { generateStore } from '../../../../../tests/generators/store';
import EditView from '../edit-view';
import { renderToString } from 'react-dom/server';

describe('Edit view', () => {
	test('create a new email', async () => {
		const store = generateStore();

		const props = {
			mailId: '',
			folderId: FOLDERS.INBOX,
			setHeader: noop,
			toggleAppBoard: false
		};

		jest.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param, defaultValue) => {
			if (param === 'action') {
				return 'new';
			}

			return undefined;
		});

		const { user } = setupTest(<EditView {...props} />, { store });

		await waitFor(() => {
			expect(screen.getByTestId('edit-view-editor')).toBeInTheDocument();
		});
		expect(screen.getByTestId('BtnSendMail')).toBeVisible();
		expect(screen.getByTestId('BtnSendMail')).toBeDisabled();
		// await waitFor(() => {
		// 	expect(screen.getByTestId('BtnSendMail').getAttribute('disabled')).toBe('');
		// });
		const subjectComponent = await screen.getByTestId('subject');
		const subjectInputField = within(subjectComponent).getByRole('textbox');
		const recipientComponent = await screen.getByTestId('RecipientTo');
		const toInputField = within(recipientComponent).getByRole('textbox');
		await user.click(toInputField);
		await user.clear(toInputField);
		const address = 'ciccio@foo.com';
		await user.type(recipientComponent, address);
		// console.log('**** val before', recipientComponent.innerHTML);
		await user.click(subjectInputField);
		// console.log('@@', toInputField);
		// expect(inputField).toHaveValue(address);
		// console.log('**** val after', recipientComponent.innerHTML);

		const btn = await screen.getByTestId('BtnSendMail');
		console.log('**** BtnSendMail', btn);

		// await waitFor(() => {
		// 	expect(screen.getByTestId('BtnSendMail')).toBeEnabled();
		// });
	});
});
