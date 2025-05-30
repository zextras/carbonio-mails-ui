/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useState } from 'react';

import {
	Container,
	Icon,
	Padding,
	PasswordInput,
	Row,
	Text,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { ModalFooter, ModalHeader } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

import { createEncryptionPassword } from 'api/create-password-api';
import { useSmimePasswordStore } from 'store/certificates/store';

type CertificatePasswordModalPropType = {
	isReset?: boolean;
	onClose: () => void;
};
export const CertificatePasswordModal = ({
	isReset,
	onClose
}: CertificatePasswordModalPropType): React.JSX.Element => {
	const [password, setPassword] = useState<string>('');
	const [confirmPassword, setConfirmPassword] = useState<string>('');
	const createSnackbar = useSnackbar();
	const [t] = useTranslation();

	const onPasswordCreate = useCallback(async (): Promise<void> => {
		createEncryptionPassword(password, isReset).then((res) => {
			if ('data' in res) {
				onClose();
				useSmimePasswordStore.getState().updateSmimePassword(password);
				createSnackbar({
					key: `password-created`,
					replace: true,
					severity: 'success',
					label: t('settings.certificatePassword.passwordCreated', 'Password created successfully'),
					autoHideTimeout: 3000,
					hideButton: true
				});
			} else {
				useSmimePasswordStore.getState().updateSmimePassword('');
				createSnackbar({
					key: `error-on-password-creation`,
					replace: true,
					severity: 'error',
					label:
						`${res?.error}` ||
						t('settings.certificatePassword.passwordCreatedFailed', 'Password creation failed'),
					autoHideTimeout: 3000,
					hideButton: true
				});
			}
		});
	}, [createSnackbar, isReset, onClose, password, t]);

	const modalHeaderTitle = !isReset
		? t(
				'settings.certificatePassword.create_password_header',
				'Create a Password for S/MIME Operations'
			)
		: t('settings.certificatePassword.reset_password', 'Reset Password');

	const onPasswordConfirm = useCallback(async (): Promise<void> => {
		if (password !== confirmPassword) {
			createSnackbar({
				key: `error-on-password-not-match`,
				replace: true,
				severity: 'error',
				label: t('settings.certificatePassword.passwordNotMatch', 'Passwords do not match'),
				autoHideTimeout: 3000,
				hideButton: true
			});
		} else if (password.length < 8) {
			createSnackbar({
				key: `error-on-password-length-not-match`,
				replace: true,
				severity: 'error',
				label: t(
					'settings.certificatePassword.passwordLengthNotMatch',
					'Password must be at least 8 characters long'
				),
				autoHideTimeout: 3000,
				hideButton: true
			});
		} else if (
			!/[A-Z]/.test(password) ||
			!/[a-z]/.test(password) ||
			!/\d/.test(password) ||
			!/[!@#$%^&*]/.test(password)
		) {
			createSnackbar({
				key: `error-on-pwd-not-include-characters`,
				replace: true,
				severity: 'error',
				label: t(
					'settings.certificatePassword.pswdNotIncludeCharacters',
					'Password must include uppercase, lowercase, numbers, and special characters'
				),
				autoHideTimeout: 3000,
				hideButton: true
			});
		} else {
			onPasswordCreate();
		}
	}, [confirmPassword, createSnackbar, onPasswordCreate, password, t]);

	return (
		<Container mainAlignment="center" crossAlignment="flex-start" height="fit">
			<ModalHeader onClose={onClose} title={modalHeaderTitle} />
			<Container padding={{ all: 'small' }} crossAlignment="flex-start" height="fit">
				{!isReset ? (
					<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
						<Text size="medium" overflow="break-word">
							{t(
								'settings.certificatePassword.createPasswordMsg1',
								'To ensure the security of your email communications, you need to create a password that will be used for every S/MIME operation.'
							)}
						</Text>
						<Padding top="medium" />
						<Text size="medium" overflow="break-word">
							{t(
								'settings.certificatePassword.createPasswordMsg2',
								'This password is essential for signing, encrypting and decrypting emails.'
							)}
						</Text>
						<Padding top="medium" />
						<Text size="medium" overflow="break-word">
							{t('settings.certificatePassword.createPasswordRule', 'Your password must be:')}
							<ul>
								<li>
									{t(
										'settings.certificatePassword.createPasswordRule1',
										'At least 8 characters long.'
									)}
								</li>
								<li>
									{t(
										'settings.certificatePassword.createPasswordRule2',
										'Include a mix of uppercase and lowercase letters, numbers, and special characters'
									)}
								</li>
							</ul>
						</Text>
					</Container>
				) : (
					<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
						<Text size="medium" overflow="break-word">
							{t(
								'settings.certificatePassword.resetPasswordMsg1',
								'Resetting your password will revoke access to all your personal certificates. This means you will need to re-upload your certificates to regain access.'
							)}
						</Text>
						<Padding top="medium" />
						<Text size="medium" overflow="break-word">
							{t('settings.certificatePassword.createPasswordRule', 'Your password must be:')}
							<ul>
								<li>
									{t(
										'settings.certificatePassword.createPasswordRule1',
										'At least 8 characters long.'
									)}
								</li>
								<li>
									{t(
										'settings.certificatePassword.createPasswordRule2',
										'Include a mix of uppercase and lowercase letters, numbers, and special characters'
									)}
								</li>
							</ul>
						</Text>
					</Container>
				)}
				<Container
					orientation="horizontal"
					mainAlignment="flex-start"
					padding={{ vertical: 'extralarge' }}
				>
					<Row mainAlignment="flex-start" width="22rem">
						<PasswordInput
							value={password}
							onChange={(ev): void => {
								setPassword && setPassword(ev.target.value);
							}}
							label={t('settings.certificatePassword.password', 'Password')}
							data-testid="password"
						/>
					</Row>
					<Row mainAlignment="flex-start" width="22rem" padding={{ left: 'small' }}>
						<PasswordInput
							value={confirmPassword}
							onChange={(ev): void => {
								setConfirmPassword && setConfirmPassword(ev.target.value);
							}}
							label={t('settings.certificatePassword.confirmPassword', 'Confirm Password')}
							data-testid="confirm_password"
							hasError={password !== confirmPassword}
						/>
					</Row>
				</Container>
				{!isReset ? (
					<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
						<Row mainAlignment="flex-start">
							<Icon icon="alertTriangleOutline" size="large" color="warning" />
							<Padding left="small" />
							<Text size="medium">{t('settings.certificatePassword.important', 'Important')}:</Text>
						</Row>
						<Text size="medium" overflow="break-word">
							{t(
								'settings.certificatePassword.createPasswordMsg3',
								'If you forget this password, we will not be able to recover your certificates or access your encrypted messages. Please store it securely in a password manager or another safe place.'
							)}
						</Text>
					</Container>
				) : (
					<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
						<Row mainAlignment="flex-start">
							<Icon icon="alertTriangleOutline" size="large" color="warning" />
							<Padding left="medium" />
							<Text size="small">{t('settings.certificatePassword.important', 'Important')}:</Text>
						</Row>
						<Text size="medium" overflow="break-word">
							{t(
								'settings.certificatePassword.resetPasswordMsg2',
								'If you are certain you want to proceed, click “Reset Password” to create a new one.'
							)}
						</Text>
					</Container>
				)}
				<ModalFooter
					onConfirm={onPasswordConfirm}
					label={t('settings.certificatePassword.enter', 'Enter')}
					secondaryAction={onClose}
					secondaryLabel={t('label.close', 'Close')}
				/>
			</Container>
		</Container>
	);
};
