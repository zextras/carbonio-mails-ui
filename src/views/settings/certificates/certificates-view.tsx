/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo, useRef } from 'react';

import {
	Breadcrumbs,
	Container,
	Crumb,
	Divider,
	FormSection,
	Row,
	useModal
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { CertificatePasswordModal } from './certificate-password-modal';
import { EnterPasswordModal } from './enter-password-modal';
import PersonalCertificatesSettings from './personal-certificates-settings';
import RecipientsCertificateSettings from './recipients-certificates-settings';
import { useUpdateView } from '../../../carbonio-ui-commons/hooks/use-update-view';
import { checkExistEncryptionPassword } from '../../../store/actions/check-exist-password-action';
import { useSmimePasswordStore } from '../../../store/zustand/certificates/store';

const CustomBreadcrumbs = styled(Breadcrumbs)`
	.breadcrumbCrumb {
		cursor: default;
	}
`;
const CertificatesView: FC = () => {
	useUpdateView();
	const { createModal, closeModal } = useModal();
	const isExistPasswordCheck = useRef(false);
	const id = Date.now().toString();
	const { smimePassword } = useSmimePasswordStore();
	const [t] = useTranslation();

	const crumbs = useMemo(
		(): Crumb[] => [
			{
				id: 'settings',
				label: t('settings.app', 'Settings'),
				className: 'breadcrumbCrumb'
			},
			{
				id: 'general',
				label: t('settings.smime_certificates', 'S/MIME Certificates'),
				className: 'breadcrumbCrumb'
			}
		],
		[t]
	);

	const onCertificatePassword = useCallback(
		(isReset?: boolean): void => {
			closeModal && closeModal(id);
			createModal(
				{
					id,
					size: 'medium',
					children: (
						<Container crossAlignment="baseline">
							<CertificatePasswordModal isReset={isReset} onClose={(): void => closeModal?.(id)} />
						</Container>
					)
				},
				true
			);
		},
		[closeModal, createModal, id]
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
							onClose={(): void => closeModal?.(id)}
						/>
					</Container>
				)
			},
			true
		);
	}, [closeModal, createModal, id, onCertificatePassword]);

	const onPasswordCheck = useCallback(
		(res: { data: Response } | { error: unknown }) => {
			if ('data' in res) {
				onEnterPassword();
			} else {
				onCertificatePassword(false);
			}
		},
		[onCertificatePassword, onEnterPassword]
	);

	useEffect(() => {
		if (!isExistPasswordCheck.current && (!smimePassword || smimePassword === '')) {
			isExistPasswordCheck.current = true;
			checkExistEncryptionPassword().then((res) => {
				onPasswordCheck(res);
			});
		}
	}, [isExistPasswordCheck, onPasswordCheck, smimePassword]);

	return (
		<>
			<Container
				orientation="vertical"
				mainAlignment="space-around"
				background={'gray5'}
				height="fit"
			>
				<Row
					padding={{ horizontal: 'small', vertical: 'medium' }}
					mainAlignment="flex-start"
					width="100%"
					crossAlignment="flex-start"
				>
					<CustomBreadcrumbs crumbs={crumbs} />
				</Row>
			</Container>
			<Divider />
			{smimePassword !== '' && (
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
