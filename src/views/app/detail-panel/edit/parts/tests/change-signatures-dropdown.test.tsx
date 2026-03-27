/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act } from '@testing-library/react';
import * as hooks from '@zextras/carbonio-shell-ui';
import { getUserAccount } from '@zextras/carbonio-shell-ui';
import { cloneDeep } from 'lodash';
import { HttpResponse } from 'msw';

import { setupTest, screen } from '@test-setup';
import {
	createAPIInterceptor,
	createSoapAPIInterceptor
} from '@test-utils/network/msw/create-api-interceptor';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { Signature } from 'types/settings';
import { EditView } from 'views/app/detail-panel/edit/edit-view';

describe('Change signature while composing mail', () => {
	beforeEach(() => {
		createSoapAPIInterceptor('GetShareInfo');
		createAPIInterceptor(
			'get',
			'/service/extension/encryption/password/enabled',
			HttpResponse.json({ enabled: true })
		);
	});

	/**
	 * Test the creation of a new email with change signature option
	 */
	it('Change signatures icon should show if user have signatures', async () => {
		const editor = generateNewMessageEditor();
		setupEditorStore({ editors: [editor] });

		setupTest(<EditView editorId={editor.id} closeController={vi.fn()} />);
		const changeSignaturesIcon = screen.getByTestId('change-sign-dropdown-icon');

		expect(changeSignaturesIcon).toBeVisible();
	});

	it('Signatures should be display in dropdown list', async () => {
		const editor = generateNewMessageEditor();
		setupEditorStore({ editors: [editor] });
		const account = getUserAccount();
		const signatures: Signature[] = account?.signatures.signature ?? [];

		const { user } = setupTest(<EditView editorId={editor.id} closeController={vi.fn()} />);
		const changeSignaturesIcon = screen.getByTestId('change-sign-dropdown-icon');
		await act(() => user.click(changeSignaturesIcon));

		expect(screen.getByTestId('dropdown-popper-list')).toBeInTheDocument();
		signatures.forEach((signature) => {
			expect(screen.getByText(signature.name)).toBeVisible();
		});
	});

	it('Change signatures icon should not show if user do not have signatures', async () => {
		const editor = generateNewMessageEditor();
		setupEditorStore({ editors: [editor] });

		const account = cloneDeep(getUserAccount());
		account && (account.signatures.signature = []);
		if (account) vi.spyOn(hooks, 'getUserAccount').mockReturnValue(account);

		setupTest(<EditView editorId={editor.id} closeController={vi.fn()} />);

		expect(screen.queryByTestId('change-sign-dropdown-icon')).not.toBeInTheDocument();
	}, 200000);
});
