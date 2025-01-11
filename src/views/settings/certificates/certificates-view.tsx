/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo, useRef } from 'react';

import { Container, FormSection, useModal } from '@zextras/carbonio-design-system';
import {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	SettingsHeader,
	SettingsHeaderProps,
	t
} from '@zextras/carbonio-shell-ui';

import { CertificatePasswordModal } from './certificate-password-modal';
import { EnterPasswordModal } from './enter-password-modal';
import PersonalCertificatesSettings from './personal-certificates-settings';
import RecipientsCertificateSettings from './recipients-certificates-settings';
import { useUpdateView } from '../../../carbonio-ui-commons/hooks/use-update-view';
import { checkExistEncryptionPassword } from '../../../store/actions/check-exist-password-action';
import { usePasswordStore } from '../../../store/zustand/certificates/store';

const CertificatesView: FC = () => {
	useUpdateView();
	const { createModal, closeModal } = useModal();
	const isExistPasswordCheck = useRef(false);
	const id = Date.now().toString();
	const { password } = usePasswordStore();

	const onClose = useCallback(() => {
		// Add your onClose logic here
		console.log('Close button clicked');
	}, []);

	const saveChanges = useCallback<SettingsHeaderProps['onSave']>(async () => {
		console.log('===>> saveChanges called');
		return Promise.resolve([]);
	}, []);

	const onPasswordConfirm = useCallback((password: string) => {
		console.log('===>> onPasswordConfirm called');
	}, []);

	const onCertificatePassword = useCallback(
		(isReset?: boolean): void => {
			closeModal && closeModal(id);
			createModal(
				{
					id,
					size: 'medium',
					children: (
						<Container crossAlignment="baseline">
							<CertificatePasswordModal
								isReset={isReset}
								onConfirm={onPasswordConfirm}
								onClose={(): void => closeModal?.(id)}
							/>
						</Container>
					)
				},
				true
			);
		},
		[closeModal, createModal, id, onPasswordConfirm]
	);

	const onEnterPassword = useCallback((): void => {
		closeModal && closeModal(id);
		createModal(
			{
				id,
				size: 'medium',
				children: (
					<Container crossAlignment="baseline">
						<EnterPasswordModal
							onPasswordReset={(): void => onCertificatePassword(true)}
							onConfirm={onPasswordConfirm}
							onClose={(): void => closeModal?.(id)}
						/>
					</Container>
				)
			},
			true
		);
	}, [closeModal, createModal, id, onCertificatePassword, onPasswordConfirm]);

	const onPasswordCheck = useCallback(
		(res: any) => {
			if ('data' in res) {
				onEnterPassword();
			} else {
				onCertificatePassword(false);
			}
		},
		[onCertificatePassword, onEnterPassword]
	);

	useEffect(() => {
		if (!isExistPasswordCheck.current && (!password || password === '')) {
			isExistPasswordCheck.current = true;
			checkExistEncryptionPassword().then((res) => {
				onPasswordCheck(res);
			});
		}
	}, [isExistPasswordCheck, onPasswordCheck, password]);

	const title = useMemo(() => t('label.smime_certificates', 'S/MIME Certificates'), []);
	return (
		<>
			<SettingsHeader onSave={saveChanges} onCancel={onClose} isDirty={false} title={title} />
			{password !== '' && (
				<Container
					orientation="vertical"
					mainAlignment="baseline"
					crossAlignment="baseline"
					background="gray5"
					style={{ overflowY: 'auto' }}
				>
					<FormSection minWidth="calc(min(100%, 32rem))">
						<PersonalCertificatesSettings />
						<RecipientsCertificateSettings />
					</FormSection>
				</Container>
			)}
		</>
	);
};

export default CertificatesView;
