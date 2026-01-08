/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act } from '@testing-library/react';
import * as hooks from '@zextras/carbonio-shell-ui';
import { getUserAccount } from '@zextras/carbonio-shell-ui';
import { cloneDeep, noop } from 'lodash';
import { HttpResponse } from 'msw';

import { EditView, EditViewProp } from '../../edit-view';
import { aSuccessfullSaveDraft } from '../../tests/utils/utils';
import { setupTest, screen } from '@test-setup';
import {
	createAPIInterceptor,
	createSoapAPIInterceptor
} from '@test-utils/network/msw/create-api-interceptor';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { addEditor } from 'store/editor/index';
import { Signature } from 'types/index.d';

describe('Change signature while composing mail', () => {
	/**
	 * Test the creation of a new email with change signature option
	 */
	it('Change signatures icon should show if user have signatures', async () => {
		createSoapAPIInterceptor('GetShareInfo');
		createAPIInterceptor(
			'get',
			'/service/extension/encryption/password/enabled',
			HttpResponse.json({ enabled: true })
		);
		const interceptor = aSuccessfullSaveDraft();
		setupEditorStore({ editors: [] });
		const editor = generateNewMessageEditor();
		addEditor({ id: editor.id, editor });

		const props: EditViewProp = {
			editorId: editor.id,
			closeController: noop
		};
		setupTest(<EditView {...props} />);
		await act(async () => {
			await interceptor;
		});
		expect(await screen.findByTestId('edit-view-editor')).toBeInTheDocument();

		const btnSend = screen.queryByTestId('BtnSendMail') || screen.queryByTestId('BtnSendMailMulti');
		expect(btnSend).toBeVisible();
		expect(btnSend).toBeDisabled();

		const changeSignaturesIcon = screen.getByTestId('change-sign-dropdown-icon');
		expect(changeSignaturesIcon).toBeVisible();
	});

	it('Signatures should be display in dropdown list', async () => {
		createSoapAPIInterceptor('GetShareInfo');
		createSoapAPIInterceptor('SaveDraft');
		setupEditorStore({ editors: [] });
		const editor = generateNewMessageEditor();
		addEditor({ id: editor.id, editor });
		const account = getUserAccount();
		const signatures: Signature[] = account?.signatures.signature ?? [];
		const props: EditViewProp = {
			editorId: editor.id,
			closeController: noop
		};
		const { user } = setupTest(<EditView {...props} />);
		expect(await screen.findByTestId('edit-view-editor')).toBeInTheDocument();
		const changeSignaturesIcon = screen.getByTestId('change-sign-dropdown-icon');
		expect(changeSignaturesIcon).toBeVisible();

		await act(() => user.click(changeSignaturesIcon));
		expect(screen.getByTestId('dropdown-popper-list')).toBeInTheDocument();
		signatures.forEach((signature) => {
			expect(screen.getByText(signature.name)).toBeVisible();
		});
	});

	it('Change signatures icon should not show if user do not have signatures', async () => {
		createSoapAPIInterceptor('GetShareInfo');
		const interceptor = aSuccessfullSaveDraft();
		setupEditorStore({ editors: [] });
		const editor = generateNewMessageEditor();
		addEditor({ id: editor.id, editor });

		const account = cloneDeep(getUserAccount());
		account && (account.signatures.signature = []);
		if (account) vi.spyOn(hooks, 'getUserAccount').mockReturnValue(account);

		const props: EditViewProp = {
			editorId: editor.id,
			closeController: noop
		};
		setupTest(<EditView {...props} />);
		await act(async () => {
			await interceptor;
		});
		expect(await screen.findByTestId('edit-view-editor')).toBeInTheDocument();

		expect(screen.queryByTestId('change-sign-dropdown-icon')).not.toBeInTheDocument();
	}, 200000);
});
