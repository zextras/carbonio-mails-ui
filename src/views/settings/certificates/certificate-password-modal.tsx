/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useState } from 'react';

import { Container, Padding, PasswordInput, Row, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import ModalFooter from '../../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../../carbonio-ui-commons/components/modals/modal-header';

type CertificatePasswordModalPropType = {
	isReset?: boolean;
	onConfirm: (password: string) => void;
	onClose: () => void;
};
export const CertificatePasswordModal = ({
	isReset,
	onConfirm,
	onClose
}: CertificatePasswordModalPropType): React.JSX.Element => {
	const [password, setPassword] = useState<string>('');
	const [t] = useTranslation();

	const modalHeaderTitle = !isReset
		? t(
				'settings.certificatePassword.create_password_header',
				'Create a Password for S/MIME Operations'
			)
		: t('settings.certificatePassword.reset_password', 'Reset Password');
	const onPasswordConfirm = useCallback(async (): Promise<void> => {
		console.log('===>> onPasswordConfirm called');
	}, []);

	return (
		<Container mainAlignment="center" crossAlignment="flex-start" height="fit">
			<ModalHeader onClose={onClose} title={modalHeaderTitle} />
			<Container padding={{ all: 'small' }} crossAlignment="flex-start" height="fit">
				{!isReset ? (
					<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
						<Text size="small" overflow="break-word">
							{t(
								'settings.certificatePassword.create_password_msg1',
								'To ensure the security of your email communications, you need to create a password that will be used for every S/MIME operation.'
							)}
						</Text>
						<Padding top="medium" />
						<Text size="small" overflow="break-word">
							{t(
								'settings.certificatePassword.create_password_msg2',
								'This password is essential for signing, encrypting and decrypting emails.'
							)}
						</Text>
						<Padding top="medium" />
						<Text size="small">
							{t('settings.certificatePassword.create_password_rule', 'Your password must be:')}
							<ul>
								<li>
									{t(
										'settings.certificatePassword.create_password_rule1',
										'At least 8 characters long.'
									)}
								</li>
								<li>
									{t(
										'settings.certificatePassword.create_password_rule2',
										'Include a mix of uppercase and lowercase letters, numbers, and special characters'
									)}
								</li>
								<li>
									{t(
										'settings.certificatePassword.create_password_rule3',
										'Be unique and not used for other accounts or purposes.'
									)}
								</li>
							</ul>
						</Text>
					</Container>
				) : (
					<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
						<Text size="small" overflow="break-word">
							{t(
								'settings.certificatePassword.reset_password_msg1',
								'Resetting your password will revoke access to all your personal certificates. This means you will need to re-upload your certificates to regain access.'
							)}
						</Text>
						<Padding top="medium" />
						<Text size="small">
							{t('settings.certificatePassword.create_password_rule', 'Your password must be:')}
							<ul>
								<li>
									{t(
										'settings.certificatePassword.create_password_rule1',
										'At least 8 characters long.'
									)}
								</li>
								<li>
									{t(
										'settings.certificatePassword.create_password_rule2',
										'Include a mix of uppercase and lowercase letters, numbers, and special characters'
									)}
								</li>
								<li>
									{t(
										'settings.certificatePassword.create_password_rule3',
										'Be unique and not used for other accounts or purposes.'
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
							value={password}
							onChange={(ev): void => {
								setPassword && setPassword(ev.target.value);
							}}
							label={t('settings.certificatePassword.confirm_password', 'Confirm Password')}
							data-testid="confirm_password"
						/>
					</Row>
				</Container>
				{!isReset ? (
					<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
						<Text size="small">
							⚠️
							{t('settings.certificatePassword.important', 'Important')}:
						</Text>
						<Text size="small" overflow="break-word">
							{t(
								'settings.certificatePassword.create_password_msg3',
								'If you forget this password, we will not be able to recover your certificates or access your encrypted messages. Please store it securely in a password manager or another safe place.'
							)}
						</Text>
					</Container>
				) : (
					<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
						<Text size="small">⚠️ {t('settings.certificatePassword.important', 'Important')}:</Text>
						<Text size="small" overflow="break-word">
							{t(
								'settings.certificatePassword.reset_password_msg2',
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
