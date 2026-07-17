/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ChangeEvent, FC, useCallback } from 'react';

import { Container, Icon, Input, Padding, Tooltip } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import {
	useEditorIsSmimeEncrypt,
	useEditorIsSmimeSign,
	useEditorIsUrgent,
	useEditorRequestReadReceipt,
	useEditorSubject
} from 'store/editor/index';
import { MailsEditorV2 } from 'types/editor';

export type SubjectRowProps = {
	editorId: MailsEditorV2['id'];
};

export const SubjectRow: FC<SubjectRowProps> = ({ editorId }) => {
	const { subject, setSubject } = useEditorSubject(editorId);
	const { isUrgent } = useEditorIsUrgent(editorId);
	const { requestReadReceipt } = useEditorRequestReadReceipt(editorId);
	const { isSmimeSign } = useEditorIsSmimeSign(editorId);
	const { isSmimeEncrypt } = useEditorIsSmimeEncrypt(editorId);

	const onSubjectChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>): void => {
			setSubject(event.target.value);
		},
		[setSubject]
	);

	return (
		<Container
			orientation="horizontal"
			background={'gray5'}
			style={{ overflow: 'hidden' }}
			padding={{ all: 0 }}
		>
			<Container background={'gray5'} style={{ overflow: 'hidden' }} padding="0">
				<Input
					data-testid={'subject'}
					label={t('label.subject', 'Subject')}
					value={subject}
					onChange={onSubjectChange}
				/>
			</Container>
			{(requestReadReceipt || isUrgent || isSmimeSign || isSmimeEncrypt) && (
				<Container
					width="fit"
					background={'gray5'}
					padding={{ right: 'medium', left: 'small' }}
					orientation="horizontal"
				>
					{requestReadReceipt && (
						<Tooltip label={t('label.request_receipt', 'Request read receipt')}>
							<Padding right="small">
								<Icon
									icon="CheckmarkSquare"
									color="secondary"
									size="large"
									data-testid="request-receipt-icon"
								/>
							</Padding>
						</Tooltip>
					)}
					{isUrgent && (
						<Tooltip label={t('tooltip.marked_as_important', 'Marked as important')}>
							<Padding right="small">
								<Icon
									icon="ArrowUpward"
									color="error"
									size="large"
									data-testid="mark-important-icon"
								/>
							</Padding>
						</Tooltip>
					)}
					{isSmimeSign && (
						<Tooltip label={t('tooltip.markedAsSingedSmime', 'Marked as signed (S/MIME)')}>
							<Padding right="small">
								<Icon
									icon="SignatureOutline"
									color="secondary"
									size="large"
									data-testid="use-certificate-icon"
								/>
							</Padding>
						</Tooltip>
					)}
					{isSmimeEncrypt && (
						<Tooltip label={t('tooltip.markedAsEncryptedSmime', 'Marked as encrypted (S/MIME)')}>
							<Padding right="small">
								<Icon
									icon="LockOutline"
									color="secondary"
									size="large"
									data-testid="use-encrypt-sign-icon"
								/>
							</Padding>
						</Tooltip>
					)}
				</Container>
			)}
		</Container>
	);
};
