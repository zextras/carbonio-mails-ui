/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { MailAuthenticationHeadersSubsection } from './mail-authentication-headers-subsection';
import { MailGeneralInfoSubsection } from './mail-general-info-subsection';
import { SmimeSubsection } from './smime-subsection';
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

export const MailInfoDetailModal: FC<MailInfoDetailModalProps> = ({
	onClose,
	signature,
	messageIdFromMailHeaders,
	creationDateFromMailHeaders,
	mailAuthenticationHeaders,
	messageIsFromDistributionList,
	messageIsFromExternalDomain,
	sensitivityValue
}) => {
	const [t] = useTranslation();
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
				<MailGeneralInfoSubsection
					messageIdFromMailHeaders={messageIdFromMailHeaders}
					creationDateFromMailHeaders={creationDateFromMailHeaders}
					messageIsFromDistributionList={messageIsFromDistributionList}
					messageIsFromExternalDomain={messageIsFromExternalDomain}
					sensitivityValue={sensitivityValue}
				/>
				<MailAuthenticationHeadersSubsection
					mailAuthenticationHeaders={mailAuthenticationHeaders}
				/>
				<SmimeSubsection signature={signature} />
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
