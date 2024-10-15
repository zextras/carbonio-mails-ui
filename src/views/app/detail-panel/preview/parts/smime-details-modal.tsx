/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useMemo } from 'react';

import { Container, Icon, Row, Text } from '@zextras/carbonio-design-system';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

import ModalFooter from '../../../../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../../../../carbonio-ui-commons/components/modals/modal-header';
import { MessageSignature } from '../../../../../types';

type SmimeDetailsModalProps = {
	onClose: () => void;
	signature: MessageSignature;
};
const ErrorMessageCode = {
	VALID: 'VALID',
	INVALID: 'INVALID',
	UNTRUSTED: 'UNTRUSTED',
	CERT_EXPIRED: 'SIGNER_CERT_EXPIRED',
	CERT_NOT_FOUND: 'SIGNER_CERT_NOT_FOUND',
	ISSUER_NOT_FOUND: 'ISSUER_CERT_NOT_FOUND',
	ERROR: 'ERROR'
};

export const SmimeDetailsModal: FC<SmimeDetailsModalProps> = ({ onClose, signature }) => {
	const [t] = useTranslation();
	const signedMsgDetails = useMemo(() => {
		switch (signature.messageCode) {
			case ErrorMessageCode.VALID:
				return {
					title: t('messages.modal.smime.valid_title', 'Message is Signed'),
					message: t(
						'messages.modal.smime.valid_msg',
						'This message includes a valid digital signature. The message has not been altered since it was sent.'
					)
				};
			case ErrorMessageCode.INVALID:
				return {
					title: t('messages.modal.smime.invalid_title', 'Digital Signature is Not Valid'),
					message: t(
						'messages.modal.smime.invalid_msg',
						'This message includes a digital signature, but the signature is invalid.'
					)
				};
			case ErrorMessageCode.UNTRUSTED:
				return {
					title: t('messages.modal.smime.untrusted_title', 'Message from an Untrusted Source'),
					message: t(
						'messages.modal.smime.untrusted_msg',
						'This message includes a digital signature, but the signer is not trusted. The certificate might not be issued by a recognized certificate authority.'
					)
				};
			case ErrorMessageCode.CERT_EXPIRED:
				return {
					title: t(
						'messages.modal.smime.cert_expired_title',
						`The Signer's Certificate Has Expired`
					),
					message: t(
						'messages.modal.smime.cert_expired_msg',
						`This message includes a digital signature, but the signer's certificate has expired. It is no longer considered valid.`
					)
				};
			case ErrorMessageCode.CERT_NOT_FOUND:
				return {
					title: t('messages.modal.smime.cert_not_found_title', `Signer's Certificate Not Found`),
					message: t(
						'messages.modal.smime.cert_not_found_msg',
						`This message includes a digital signature, but the signer's certificate could not be found. The signature cannot be validated.`
					)
				};
			case ErrorMessageCode.ISSUER_NOT_FOUND:
				return {
					title: t('messages.modal.smime.issuer_not_found_title', `Issuer's Certificate Not Found`),
					message: t(
						'messages.modal.smime.issuer_not_found_msg',
						'This message includes a digital signature, but the certificate of the issuing authority could not be found.'
					)
				};
			default:
				return {
					title: t(
						'messages.modal.smime.error_title',
						'An Error Occurred During Signature Verification'
					),
					message: t(
						'messages.modal.smime.error_msg',
						'There was an error processing the digital signature. The signature could not be verified.'
					)
				};
		}
	}, [signature.messageCode, t]);
	return (
		<Container mainAlignment="center" crossAlignment="flex-start" height="fit">
			<ModalHeader
				title={t('messages.modal.smime.title', 'Certificate details')}
				onClose={onClose}
			/>
			<Container mainAlignment="flex-start" orientation="vertical" crossAlignment="flex-start">
				<Row mainAlignment="flex-start" padding={{ bottom: 'small' }}>
					<Icon
						size="medium"
						icon={'SignatureOutline'}
						color={signature?.valid ? 'success' : 'error'}
						style={{ alignSelf: 'center', paddingRight: '0.5rem' }}
					/>
					<Text weight="bold">{signedMsgDetails.title}</Text>
				</Row>
				<Row mainAlignment="flex-start" padding={{ bottom: 'extralarge' }}>
					<Text size="small" overflow="break-word">
						{signedMsgDetails.message}
					</Text>
				</Row>
				<Row padding={{ bottom: 'small' }}>
					<Text weight="bold" style={{ paddingRight: '0.5rem' }}>
						{t('messages.modal.smime.signed_by', 'Signed By')} :
					</Text>
					{signature.certificate.email}
				</Row>
				<Row padding={{ bottom: 'small' }}>
					<Text weight="bold" style={{ paddingRight: '0.5rem' }}>
						{t('messages.modal.smime.issuer', 'Issuer')} :
					</Text>
					{signature.certificate.issuer.name}
				</Row>
				<Row padding={{ bottom: 'small' }}>
					<Text weight="bold" style={{ paddingRight: '0.5rem' }}>
						{t('messages.modal.smime.validity', 'Validity')} :
					</Text>
					{moment(signature.certificate.notBefore).format('DD/MM/YYYY HH:MM')} -{' '}
					{moment(signature.certificate.notAfter).format('DD/MM/YYYY HH:MM')}
				</Row>
			</Container>
			<ModalFooter
				onConfirm={(): void => {
					onClose();
				}}
				label={t('label.close', 'Close')}
			/>
		</Container>
	);
};
