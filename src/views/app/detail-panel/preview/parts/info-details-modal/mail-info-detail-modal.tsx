/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { MailAuthenticationHeadersSubsection } from './subsections/mail-authentication-headers-subsection';
import { MailGeneralInfoSubsection } from './subsections/mail-general-info-subsection';
import { SmimeSubsection } from './subsections/smime-subsection';
import ModalFooter from '../../../../../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../../../../../carbonio-ui-commons/components/modals/modal-header';
import { IncompleteMessage, MessageSignature } from '../../../../../../types';

type MailInfoDetailModalProps = {
	onClose: () => void;
	signature?: MessageSignature;
	messageIdFromMailHeaders?: string;
	creationDateFromMailHeaders?: string;
	mailAuthenticationHeaders?: IncompleteMessage['authenticationHeaders'];
	messageIsFromDistributionList?: IncompleteMessage['messageIsFromDistributionList'];
	messageIsFromExternalDomain?: IncompleteMessage['messageIsFromExternalDomain'];
	sensitivityValue?: IncompleteMessage['sensitivity'];
};

export const MailInfoDetailModal = ({
	onClose,
	signature,
	messageIdFromMailHeaders,
	creationDateFromMailHeaders,
	mailAuthenticationHeaders,
	messageIsFromDistributionList,
	messageIsFromExternalDomain,
	sensitivityValue
}: MailInfoDetailModalProps): React.JSX.Element => {
	const [t] = useTranslation();
	const showGeneralInfo =
		messageIdFromMailHeaders ??
		creationDateFromMailHeaders ??
		(messageIsFromDistributionList || messageIsFromExternalDomain || sensitivityValue);
	return (
		<Container
			mainAlignment="center"
			crossAlignment="flex-start"
			height="fit"
			data-testid="info-details-modal"
			style={{ overflow: 'auto' }}
		>
			<ModalHeader
				title={t('messages.modal.info_details.title', 'Message details')}
				onClose={onClose}
			/>
			<Container style={{ display: 'block', overflowY: 'scroll' }}>
				{showGeneralInfo && (
					<MailGeneralInfoSubsection
						messageIdFromMailHeaders={messageIdFromMailHeaders}
						creationDateFromMailHeaders={creationDateFromMailHeaders}
						messageIsFromDistributionList={messageIsFromDistributionList}
						messageIsFromExternalDomain={messageIsFromExternalDomain}
						sensitivityValue={sensitivityValue}
					/>
				)}
				{mailAuthenticationHeaders && (
					<MailAuthenticationHeadersSubsection authenticationInfo={mailAuthenticationHeaders} />
				)}
				{signature && <SmimeSubsection signature={signature} />}
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
