/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useState } from 'react';

import {
	Container,
	Link,
	PasswordInput,
	Row,
	Text,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { ModalFooter, ModalHeader } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

import { checkEncryptionPassword } from 'api/check-password-api';
import { useSmimePasswordStore } from 'store/certificates/store';

type EnterPasswordModalPropType = {
	onPasswordReset?: () => void;
	onConfirm?: (password: string) => void;
	onClose: () => void;
	hideReset?: boolean;
};
export const EnterPasswordModal = ({
	onPasswordReset,
	onConfirm,
	onClose,
	hideReset = false
}: EnterPasswordModalPropType): React.JSX.Element => {
	const [password, setPassword] = useState<string>('');
	const createSnackbar = useSnackbar();
	const [t] = useTranslation();
	const modalHeaderTitle = t('settings.uploadCertificate.enter_password', 'Enter password');

	const onPasswordConfirm = useCallback(async (): Promise<void> => {
		checkEncryptionPassword(password).then((res) => {
			if ('data' in res) {
				useSmimePasswordStore.getState().updateSmimePassword(password);
				createSnackbar({
					key: `password-is-correct`,
					replace: true,
					severity: 'success',
					label: t('settings.uploadCertificate.passwordIsCorrect', 'Password is correct'),
					autoHideTimeout: 3000,
					hideButton: true
				});
				onConfirm && onConfirm(password);
				onClose();
			} else {
				useSmimePasswordStore.getState().updateSmimePassword('');
				createSnackbar({
					key: `password-is-incorrect`,
					replace: true,
					severity: 'error',
					label: t('settings.uploadCertificate.passwordIsInCorrect', 'Password is incorrect'),
					autoHideTimeout: 3000,
					hideButton: true
				});
			}
		});
	}, [createSnackbar, onClose, onConfirm, password, t]);

	const resetPassword = useCallback(() => {
		onPasswordReset && onPasswordReset();
	}, [onPasswordReset]);

	return (
		<Container mainAlignment="center" crossAlignment="flex-start" height="fit">
			<ModalHeader onClose={onClose} title={modalHeaderTitle} />
			<Container padding={{ all: 'small' }} crossAlignment="flex-start" height="fit">
				<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
					<Text size="medium" overflow="break-word">
						{t(
							'settings.uploadCertificate.EnterPasswordMsg',
							'To use S/MIME related actions enter the password'
						)}
					</Text>
				</Container>
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
							label={t('settings.uploadCertificate.password', 'Password')}
							data-testid="enter-password"
						/>
					</Row>
				</Container>
				{!hideReset && (
					<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
						<Link underlined onClick={resetPassword}>
							{t('settings.uploadCertificate.resetPassword', 'Reset password')}
						</Link>
					</Container>
				)}
				<ModalFooter
					onConfirm={onPasswordConfirm}
					label={t('settings.uploadCertificate.enter', 'Enter')}
					secondaryAction={onClose}
					secondaryLabel={t('label.close', 'Close')}
				/>
			</Container>
		</Container>
	);
};
