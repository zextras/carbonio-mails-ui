/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act } from '@testing-library/react';
import { getUserAccount } from '@zextras/carbonio-shell-ui';
import * as hooks from '@zextras/carbonio-shell-ui';
import { cloneDeep, noop } from 'lodash';

import { createSoapAPIInterceptor } from '../../../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { screen, setupTest } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { addEditor } from '../../../../../../store/zustand/editor';
import { generateNewMessageEditor } from '../../../../../../store/zustand/editor/editor-generators';
import { setupEditorStore } from '../../../../../../tests/generators/editor-store';
import { generateStore } from '../../../../../../tests/generators/store';
import { Signature } from '../../../../../../types';
import { EditView, EditViewProp } from '../../edit-view';
import { aSuccessfullSaveDraft } from '../../tests/utils/utils';

describe('Change signature while composing mail', () => {
	/**
	 * Test the creation of a new email with change signature option
	 */
	it('Change signatures icon should show if user have signatures', async () => {
		createSoapAPIInterceptor('GetShareInfo');
		const interceptor = aSuccessfullSaveDraft();
		setupEditorStore({ editors: [] });
		const reduxStore = generateStore();
		const editor = generateNewMessageEditor(reduxStore.dispatch);
		addEditor({ id: editor.id, editor });

		const props: EditViewProp = {
			editorId: editor.id,
			closeController: noop
		};
		setupTest(<EditView {...props} />, { store: reduxStore });
		await interceptor;
		expect(await screen.findByTestId('edit-view-editor')).toBeInTheDocument();

		const btnSend = screen.queryByTestId('BtnSendMail') || screen.queryByTestId('BtnSendMailMulti');
		expect(btnSend).toBeVisible();
		expect(btnSend).toBeDisabled();

		const changeSignaturesIcon = screen.getByTestId('change-sign-dropdown-icon');
		expect(changeSignaturesIcon).toBeVisible();
	});

	test('Signatures should be display in dropdown list', async () => {
		createSoapAPIInterceptor('GetShareInfo');
		setupEditorStore({ editors: [] });
		const reduxStore = generateStore();
		const editor = generateNewMessageEditor(reduxStore.dispatch);
		addEditor({ id: editor.id, editor });
		const account = getUserAccount();
		const signatures: Signature[] = account?.signatures.signature ?? [];
		const props: EditViewProp = {
			editorId: editor.id,
			closeController: noop
		};
		const { user } = setupTest(<EditView {...props} />, { store: reduxStore });
		expect(await screen.findByTestId('edit-view-editor')).toBeInTheDocument();
		const changeSignaturesIcon = screen.getByTestId('change-sign-dropdown-icon');
		expect(changeSignaturesIcon).toBeVisible();

		await act(() => user.click(changeSignaturesIcon));
		expect(screen.getByTestId('dropdown-popper-list')).toBeInTheDocument();
		signatures.forEach((signature) => {
			expect(screen.getByText(signature.name)).toBeVisible();
		});
	});

	test('Change signatures icon should not show if user do not have signatures', async () => {
		createSoapAPIInterceptor('GetShareInfo');
		const interceptor = aSuccessfullSaveDraft();
		setupEditorStore({ editors: [] });
		const reduxStore = generateStore();
		const editor = generateNewMessageEditor(reduxStore.dispatch);
		addEditor({ id: editor.id, editor });

		const account = cloneDeep(getUserAccount());
		account && (account.signatures.signature = []);
		if (account) jest.spyOn(hooks, 'getUserAccount').mockReturnValue(account);

		const props: EditViewProp = {
			editorId: editor.id,
			closeController: noop
		};
		setupTest(<EditView {...props} />, { store: reduxStore });
		await interceptor;
		expect(await screen.findByTestId('edit-view-editor')).toBeInTheDocument();

		expect(screen.queryByTestId('change-sign-dropdown-icon')).not.toBeInTheDocument();
	}, 200000);
});
