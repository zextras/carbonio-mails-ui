/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { ModalFooter, ModalHeader } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

import { IncompleteMessage } from 'types/messages';
import { MessageSignature } from 'types/soap/soap-mail-message';
import { MailGeneralInfoSubsection } from 'views/app/detail-panel/preview/parts/info-details-modal/subsections/mail-general-info-subsection';
import { SmimeSubsection } from 'views/app/detail-panel/preview/parts/info-details-modal/subsections/smime-subsection';

type MailInfoDetailModalProps = {
	onClose: () => void;
	signature?: MessageSignature;
	messageIdFromMailHeaders?: string;
	creationDateFromMailHeaders?: string;
	// authenticationMailsHeaders?: IncompleteMessage['authenticationHeaders'];
	messageIsFromDistributionList?: IncompleteMessage['messageIsFromDistributionList'];
	messageIsFromExternalDomain?: IncompleteMessage['messageIsFromExternalDomain'];
	sensitivityValue?: IncompleteMessage['sensitivity'];
};

export const MailInfoDetailModal = ({
	onClose,
	signature,
	messageIdFromMailHeaders,
	creationDateFromMailHeaders,
	// authenticationMailsHeaders,
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
				{/* {authenticationMailsHeaders && ( */}
				{/* 	<MailAuthenticationHeadersSubsection */}
				{/* 		authenticationMailsHeaders={authenticationMailsHeaders} */}
				{/* 	/> */}
				{/* )} */}
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
