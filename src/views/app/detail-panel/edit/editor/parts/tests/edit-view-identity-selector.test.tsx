/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act } from '@testing-library/react';
import * as shell from '@zextras/carbonio-shell-ui';

import { screen, setupTest } from '@test-setup';
import { generateAccount } from '@test-utils/accounts/account-generator';
import { setupEditorStore } from '__test__/generators/editor-store';
import { getNoIdentityPlaceholder } from 'helpers/identities';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { EditViewIdentitySelector } from 'views/app/detail-panel/edit/editor/parts/edit-view-identity-selector';

describe('EditViewIdentitySelector', () => {
	const delegateAddress = 'user1@demo.zextras.io';
	const delegateDisplayName = 'User One';
	const sendAsAddress = 'account1@demo.zextras.io';

	/**
	 * Mocks an account which is a delegate, with the "sendAs" right, of an account created
	 * without a displayName: the server returns the target without the "d" attribute
	 */
	const mockDelegateAccount = (): void => {
		vi.spyOn(shell, 'getUserAccount').mockReturnValue({
			...generateAccount(),
			id: '1',
			name: delegateAddress,
			displayName: delegateDisplayName,
			identities: {
				identity: [
					{
						id: '1',
						name: 'DEFAULT',
						_attrs: {
							zimbraPrefIdentityId: '1',
							zimbraPrefIdentityName: 'DEFAULT',
							zimbraPrefFromAddress: delegateAddress,
							zimbraPrefFromDisplay: delegateDisplayName
						}
					}
				]
			},
			rights: {
				targets: [
					{
						right: 'sendAs',
						target: [
							{
								id: sendAsAddress,
								name: sendAsAddress,
								type: 'account',
								email: [{ addr: sendAsAddress }]
							}
						]
					}
				]
			} as never // cannot import AccountRights from carbonio-shell-ui
		});
	};

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should list a delegated identity without display name by its address', async () => {
		mockDelegateAccount();
		const editor = generateNewMessageEditor();
		setupEditorStore({ editors: [editor] });

		const { user } = setupTest(<EditViewIdentitySelector editorId={editor.id} />);
		await act(() => user.click(screen.getByTestId('identity-selector-toggle')));

		expect(screen.getByText(`<${sendAsAddress}>`)).toBeVisible();
		expect(screen.getAllByText(sendAsAddress)[0]).toBeVisible();
		expect(screen.queryByText(getNoIdentityPlaceholder())).not.toBeInTheDocument();
		expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
	});

	it('should display the address of the selected delegated identity without display name', () => {
		mockDelegateAccount();
		const editor = { ...generateNewMessageEditor(), identityId: `${sendAsAddress}sendAs` };
		setupEditorStore({ editors: [editor] });

		setupTest(<EditViewIdentitySelector editorId={editor.id} />);

		// The address is displayed both as name of the identity and as its description
		expect(screen.getAllByText(sendAsAddress)).toHaveLength(2);
		expect(screen.queryByText(getNoIdentityPlaceholder())).not.toBeInTheDocument();
		expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
	});
});
