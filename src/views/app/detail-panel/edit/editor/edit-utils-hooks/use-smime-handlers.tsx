/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect } from 'react';

import { Container, useSnackbar, useModal } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { checkExistEncryptionPassword } from 'api/check-exist-password-api';
import { checkPersonalCertificateExist } from 'api/check-personal-certificate-exist-api';
import { getIdentityDescriptor } from 'helpers/identities';
import { useSmimePasswordStore } from 'store/certificates/store';
import { useEditorIsSmimeSign, useEditorIsSmimeEncrypt, useEditorIdentityId } from 'store/editor';
import { EnterPasswordModal } from 'views/settings/certificates/enter-password-modal';

type SmimeOption = 'sign' | 'encrypt';
type UseSmimeHandlersReturn = {
	isSmimeSign: boolean | undefined;
	isSmimeEncrypt: boolean | undefined;
	checkCertificateExist: (option: SmimeOption, password?: string) => void;
	handleSmimeSelected: () => void;
	handleSmimeDeselected: () => void;
	handleEncryptSelected: () => void;
	handleEncryptDeselected: () => void;
};

export const useSmimeHandlers = (editorId: string): UseSmimeHandlersReturn => {
	const { identityId } = useEditorIdentityId(editorId);
	const identityEmailAddress = getIdentityDescriptor(identityId)?.fromAddress;
	const { isSmimeSign, setIsSmimeSign } = useEditorIsSmimeSign(editorId);
	const { isSmimeEncrypt, setIsSmimeEncrypt } = useEditorIsSmimeEncrypt(editorId);
	const { smimePassword } = useSmimePasswordStore();
	const createSnackbar = useSnackbar();
	const { createModal, closeModal } = useModal();

	const handleCertificateResponse = useCallback(
		(option: SmimeOption, res: { data: Response } | { error: unknown }) => {
			if ('data' in res) {
				option === 'sign' ? setIsSmimeSign(true) : setIsSmimeEncrypt(true);
			} else {
				option === 'sign' ? setIsSmimeSign(false) : setIsSmimeEncrypt(false);
				createSnackbar({
					key: 'info-on-certificate-missing',
					replace: true,
					severity: 'error',
					label: t(
						'settings.uploadCertificate.uploadCertificateInSettings',
						'Please upload your certificate from settings'
					),
					autoHideTimeout: 3000,
					hideButton: true
				});
			}
		},
		[createSnackbar, setIsSmimeEncrypt, setIsSmimeSign]
	);

	const checkCertificateExist = useCallback(
		(option: SmimeOption, password?: string) => {
			if (identityEmailAddress) {
				checkPersonalCertificateExist(password ?? smimePassword, identityEmailAddress).then((res) =>
					handleCertificateResponse(option, res)
				);
			}
		},
		[identityEmailAddress, smimePassword, handleCertificateResponse]
	);

	useEffect(() => {
		if (identityEmailAddress && (isSmimeSign || isSmimeEncrypt)) {
			if (isSmimeSign) {
				checkCertificateExist('sign');
			} else {
				checkCertificateExist('encrypt');
			}
		}
	}, [identityEmailAddress, isSmimeSign, isSmimeEncrypt, checkCertificateExist]);

	const checkEncryptionPassword = useCallback(
		(option: SmimeOption) => {
			checkExistEncryptionPassword().then((res) => {
				if ('data' in res) {
					const id = Date.now().toString();
					createModal(
						{
							id,
							size: 'medium',
							onClose: () => closeModal?.(id),
							children: (
								<Container crossAlignment="baseline">
									<EnterPasswordModal
										onConfirm={(password): void => checkCertificateExist(option, password)}
										onClose={(): void => closeModal?.(id)}
										hideReset
									/>
								</Container>
							)
						},
						true
					);
				} else {
					option === 'sign' ? setIsSmimeSign(false) : setIsSmimeEncrypt(false);
					createSnackbar({
						key: 'info-on-password-missing',
						replace: true,
						severity: 'error',
						label: t(
							'settings.uploadCertificate.createPasswordFromSettings',
							'Please create your encryption password from settings'
						),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			});
		},
		[
			createModal,
			checkCertificateExist,
			closeModal,
			createSnackbar,
			setIsSmimeSign,
			setIsSmimeEncrypt
		]
	);

	const handleSmimeAction = useCallback(
		(type: SmimeOption) => {
			if (!identityEmailAddress) return;

			if (smimePassword === '') {
				checkEncryptionPassword(type);
			} else {
				checkCertificateExist(type);
			}
		},
		[checkCertificateExist, checkEncryptionPassword, identityEmailAddress, smimePassword]
	);

	const handleSmimeSelected = useCallback(() => handleSmimeAction('sign'), [handleSmimeAction]);
	const handleSmimeDeselected = useCallback(() => setIsSmimeSign(false), [setIsSmimeSign]);

	const handleEncryptSelected = useCallback(
		() => handleSmimeAction('encrypt'),
		[handleSmimeAction]
	);
	const handleEncryptDeselected = useCallback(() => setIsSmimeEncrypt(false), [setIsSmimeEncrypt]);

	return {
		isSmimeSign,
		isSmimeEncrypt,
		checkCertificateExist,
		handleSmimeSelected,
		handleSmimeDeselected,
		handleEncryptSelected,
		handleEncryptDeselected
	};
};
