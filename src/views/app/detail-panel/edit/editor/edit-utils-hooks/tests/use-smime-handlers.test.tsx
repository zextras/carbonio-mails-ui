/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor, within } from '@testing-library/react';
import { noop } from 'lodash';
import { HttpResponse } from 'msw';
import type { Mock } from 'vitest';

import { EditView } from '../../edit-view';
import { setupTest } from '@test-setup';
import {
	createAPIInterceptor,
	createSoapAPIInterceptor
} from '@test-utils/network/msw/create-api-interceptor';
import { getEmptyMSWShareInfoResponse } from '@test-utils/network/msw/handle-get-share-info';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewEditor } from '__test__/generators/editors';
import { checkExistEncryptionPassword } from 'api/check-exist-password-api';
import { checkPersonalCertificateExist } from 'api/check-personal-certificate-exist-api';
import { useSmimePasswordStore } from 'store/certificates/store';

vi.mock('api/check-personal-certificate-exist-api');
vi.mock('api/check-exist-password-api');

const createSmimeEnabledInterceptor = (): void => {
	createAPIInterceptor(
		'get',
		'/service/extension/encryption/password/enabled',
		HttpResponse.json({ enabled: true })
	);
};

const openOptionsDropdown = async (user: ReturnType<typeof setupTest>['user']): Promise<void> => {
	const optionsIcon = await screen.findByTestId('options-dropdown-icon');
	await user.click(optionsIcon);
};

const getDropdownList = (): HTMLElement => screen.getByTestId('dropdown-popper-list');

const getSmimeSignOption = (): HTMLElement =>
	within(getDropdownList()).getByText('composer.uploadCertificate.useCertificateToSign');

const getSmimeEncryptOption = (): HTMLElement =>
	within(getDropdownList()).getByText('composer.uploadCertificate.useCertificateToEncrypt');

const renderEditView = (): ReturnType<typeof setupTest> => {
	const editor = generateNewEditor();
	setupEditorStore({ editors: [editor] });
	return setupTest(<EditView editorId={editor.id} closeController={noop} />);
};

describe('useSmimeHandlers (via EditView + OptionsDropdown)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		createSmimeEnabledInterceptor();
		createSoapAPIInterceptor('GetShareInfo', getEmptyMSWShareInfoResponse());
		useSmimePasswordStore.getState().updateSmimePassword('secret');
	});

	describe('handleSmimeSelected', () => {
		it('should show "Use certificate to sign" option in dropdown when S/MIME is enabled', async () => {
			const { user } = renderEditView();

			await openOptionsDropdown(user);

			expect(getSmimeSignOption()).toBeVisible();
		});

		it('should show "Remove certificate to sign" label after selecting sign with valid certificate', async () => {
			(checkPersonalCertificateExist as Mock).mockResolvedValue({ data: new Response() });

			const { user } = renderEditView();
			await openOptionsDropdown(user);
			await user.click(getSmimeSignOption());
			await waitFor(() => expect(checkPersonalCertificateExist).toHaveBeenCalled());

			await openOptionsDropdown(user);
			expect(
				within(getDropdownList()).getByText('composer.uploadCertificate.removeCertificateToSign')
			).toBeVisible();
		});

		it('should show error snackbar when certificate is missing on sign selection', async () => {
			(checkPersonalCertificateExist as Mock).mockResolvedValue({ error: 'not found' });

			const { user } = renderEditView();
			await openOptionsDropdown(user);
			await user.click(getSmimeSignOption());

			expect(
				await screen.findByText('settings.uploadCertificate.uploadCertificateInSettings')
			).toBeVisible();
		});

		it('should open password modal when smimePassword is empty on sign selection', async () => {
			(checkExistEncryptionPassword as Mock).mockResolvedValue({ data: new Response() });
			useSmimePasswordStore.getState().updateSmimePassword('');

			const { user } = renderEditView();
			await openOptionsDropdown(user);
			await user.click(getSmimeSignOption());

			await waitFor(() => {
				expect(screen.getByTestId('modal')).toBeInTheDocument();
			});
		});

		it('should show error snackbar when no encryption password exists on sign selection', async () => {
			(checkExistEncryptionPassword as Mock).mockResolvedValue({ error: 'not found' });
			useSmimePasswordStore.getState().updateSmimePassword('');

			const { user } = renderEditView();
			await openOptionsDropdown(user);
			await user.click(getSmimeSignOption());

			expect(
				await screen.findByText('settings.uploadCertificate.createPasswordFromSettings')
			).toBeVisible();
		});
	});

	describe('handleSmimeDeselected', () => {
		it('should revert to "Use certificate to sign" label after deselecting', async () => {
			(checkPersonalCertificateExist as Mock).mockResolvedValue({ data: new Response() });

			const { user } = renderEditView();

			await openOptionsDropdown(user);
			await user.click(getSmimeSignOption());
			await waitFor(() => expect(checkPersonalCertificateExist).toHaveBeenCalled());

			await openOptionsDropdown(user);
			await waitFor(() =>
				expect(
					within(getDropdownList()).getByText('composer.uploadCertificate.removeCertificateToSign')
				).toBeVisible()
			);
			await user.click(
				within(getDropdownList()).getByText('composer.uploadCertificate.removeCertificateToSign')
			);

			await openOptionsDropdown(user);
			await waitFor(() =>
				expect(
					within(getDropdownList()).getByText('composer.uploadCertificate.useCertificateToSign')
				).toBeVisible()
			);
		});
	});

	describe('handleEncryptSelected', () => {
		it('should show "Use certificate to encrypt" option in dropdown when S/MIME is enabled', async () => {
			const { user } = renderEditView();

			await openOptionsDropdown(user);

			expect(getSmimeEncryptOption()).toBeVisible();
		});

		it('should show "Remove certificate to encrypt" label after selecting encrypt with valid certificate', async () => {
			(checkPersonalCertificateExist as Mock).mockResolvedValue({ data: new Response() });

			const { user } = renderEditView();
			await openOptionsDropdown(user);
			await user.click(getSmimeEncryptOption());
			await waitFor(() => expect(checkPersonalCertificateExist).toHaveBeenCalled());

			await openOptionsDropdown(user);
			expect(
				within(getDropdownList()).getByText('composer.uploadCertificate.removeCertificateToEncrypt')
			).toBeVisible();
		});

		it('should show error snackbar when certificate is missing on encrypt selection', async () => {
			(checkPersonalCertificateExist as Mock).mockResolvedValue({ error: 'not found' });

			const { user } = renderEditView();
			await openOptionsDropdown(user);
			await user.click(getSmimeEncryptOption());

			expect(
				await screen.findByText('settings.uploadCertificate.uploadCertificateInSettings')
			).toBeVisible();
		});

		it('should open password modal when smimePassword is empty on encrypt selection', async () => {
			(checkExistEncryptionPassword as Mock).mockResolvedValue({ data: new Response() });
			useSmimePasswordStore.getState().updateSmimePassword('');

			const { user } = renderEditView();
			await openOptionsDropdown(user);
			await user.click(getSmimeEncryptOption());

			await waitFor(() => {
				expect(screen.getByTestId('modal')).toBeInTheDocument();
			});
		});

		it('should show error snackbar when no encryption password exists on encrypt selection', async () => {
			(checkExistEncryptionPassword as Mock).mockResolvedValue({ error: 'not found' });
			useSmimePasswordStore.getState().updateSmimePassword('');

			const { user } = renderEditView();
			await openOptionsDropdown(user);
			await user.click(getSmimeEncryptOption());

			expect(
				await screen.findByText('settings.uploadCertificate.createPasswordFromSettings')
			).toBeVisible();
		});
	});

	describe('handleEncryptDeselected', () => {
		it('should revert to "Use certificate to encrypt" label after deselecting', async () => {
			(checkPersonalCertificateExist as Mock).mockResolvedValue({ data: new Response() });

			const { user } = renderEditView();

			await openOptionsDropdown(user);
			await user.click(getSmimeEncryptOption());
			await waitFor(() => expect(checkPersonalCertificateExist).toHaveBeenCalled());

			await openOptionsDropdown(user);
			await waitFor(() =>
				expect(
					within(getDropdownList()).getByText(
						'composer.uploadCertificate.removeCertificateToEncrypt'
					)
				).toBeVisible()
			);
			await user.click(
				within(getDropdownList()).getByText('composer.uploadCertificate.removeCertificateToEncrypt')
			);

			await openOptionsDropdown(user);
			await waitFor(() =>
				expect(
					within(getDropdownList()).getByText('composer.uploadCertificate.useCertificateToEncrypt')
				).toBeVisible()
			);
		});
	});
});
