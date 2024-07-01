/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';
import { noop, times } from 'lodash';

import { createSoapAPIInterceptor } from '../../../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { setupTest } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { addEditor } from '../../../../../../store/zustand/editor';
import { generateNewMessageEditor } from '../../../../../../store/zustand/editor/editor-generators';
import { setupEditorStore } from '../../../../../../tests/generators/editor-store';
import { buildSignature } from '../../../../../../tests/generators/signatures';
import { generateStore } from '../../../../../../tests/generators/store';
import { handleGetSignaturesRequest } from '../../../../../../tests/mocks/network/msw/handle-get-signatures';
import { SignItemType } from '../../../../../../types';
import { EditView, EditViewProp } from '../../edit-view';

describe('Change signature while composing mail', () => {
	/**
	 * Test the creation of a new email with change signature option
	 */
	it('Change singnatures icon should show if user have signatures', async () => {
		createSoapAPIInterceptor('GetShareInfo');
		setupEditorStore({ editors: [] });
		const reduxStore = generateStore();
		const editor = generateNewMessageEditor(reduxStore.dispatch);
		addEditor({ id: editor.id, editor });
		const signatures: Array<SignItemType> = times(1, () => buildSignature({}));
		handleGetSignaturesRequest(signatures);

		const props: EditViewProp = {
			editorId: editor.id,
			closeController: noop
		};
		setupTest(<EditView {...props} />, { store: reduxStore });
		expect(await screen.findByTestId('edit-view-editor')).toBeInTheDocument();

		const btnSend = screen.queryByTestId('BtnSendMail') || screen.queryByTestId('BtnSendMailMulti');
		expect(btnSend).toBeVisible();
		expect(btnSend).toBeDisabled();

		const changeSignaturesIcon = screen.getByTestId('change-sign-dropdown-icon');
		expect(changeSignaturesIcon).toBeVisible();
	});

	test('Change singnatures icon should not show if user do not have signatures', async () => {
		createSoapAPIInterceptor('GetShareInfo');
		setupEditorStore({ editors: [] });
		const reduxStore = generateStore();
		const editor = generateNewMessageEditor(reduxStore.dispatch);
		addEditor({ id: editor.id, editor });
		handleGetSignaturesRequest([]);

		const props: EditViewProp = {
			editorId: editor.id,
			closeController: noop
		};
		setupTest(<EditView {...props} />, { store: reduxStore });
		expect(await screen.findByTestId('edit-view-editor')).toBeInTheDocument();

		expect(screen.queryByTestId('change-sign-dropdown-icon')).not.toBeInTheDocument();
	}, 200000);

	it('Singnatures should be display in dropdown list', async () => {
		createSoapAPIInterceptor('GetShareInfo');
		setupEditorStore({ editors: [] });
		const reduxStore = generateStore();
		const editor = generateNewMessageEditor(reduxStore.dispatch);
		addEditor({ id: editor.id, editor });
		const signatures: Array<SignItemType> = times(3, () => buildSignature({}));
		handleGetSignaturesRequest(signatures);

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
			expect(screen.getByText(signature.label)).toBeVisible();
		});
	});
});
