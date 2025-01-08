/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
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
import { useTranslation } from 'react-i18next';

import ModalFooter from '../../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../../carbonio-ui-commons/components/modals/modal-header';
import { checkEncryptionPassword } from '../../../store/actions/check-password-action';
import { usePasswordStore } from '../../../store/zustand/certificates/store';

type EnterPasswordModalPropType = {
	onPasswordReset: () => void;
	onConfirm: (password: string) => void;
	onClose: () => void;
};
export const EnterPasswordModal = ({
	onPasswordReset,
	onConfirm,
	onClose
}: EnterPasswordModalPropType): React.JSX.Element => {
	const [password, setPassword] = useState<string>('');
	const createSnackbar = useSnackbar();
	const [t] = useTranslation();
	const modalHeaderTitle = t('settings.certificatePassword.enter_password', 'Enter password');

	const onPasswordConfirm = useCallback(async (): Promise<void> => {
		checkEncryptionPassword(password).then((res) => {
			if ('data' in res) {
				onClose();
				usePasswordStore.getState().updatePassword(password);
				createSnackbar({
					key: `error-on-certificate-upload`,
					replace: true,
					severity: 'success',
					label: 'Password is correct',
					autoHideTimeout: 3000,
					hideButton: true
				});
			} else {
				usePasswordStore.getState().updatePassword('');
				createSnackbar({
					key: `error-on-certificate-upload`,
					replace: true,
					severity: 'error',
					label: 'Password is incorrect',
					autoHideTimeout: 3000,
					hideButton: true
				});
			}
		});
	}, [createSnackbar, onClose, password]);

	const resetPassword = useCallback(() => {
		onPasswordReset();
	}, [onPasswordReset]);

	return (
		<Container mainAlignment="center" crossAlignment="flex-start" height="fit">
			<ModalHeader onClose={onClose} title={modalHeaderTitle} />
			<Container padding={{ all: 'small' }} crossAlignment="flex-start" height="fit">
				<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
					<Text size="small" overflow="break-word">
						{t(
							'settings.certificatePassword.enter_password_msg',
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
							label={t('settings.certificatePassword.password', 'Password')}
							data-testid="enter-password"
						/>
					</Row>
				</Container>
				<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
					<Link underlined onClick={resetPassword}>
						{t('settings.certificatePassword.reset_password', 'Reset password')}
					</Link>
				</Container>
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
