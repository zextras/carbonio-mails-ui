/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ChangeEvent, FC, useCallback } from 'react';

import { Container, Icon, Input, Padding, Tooltip } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import {
	useEditorIsUrgent,
	useEditorRequestReadReceipt,
	useEditorSubject
} from '../../../../../store/zustand/editor';
import { MailsEditorV2 } from '../../../../../types';

export type SubjectRowProps = {
	editorId: MailsEditorV2['id'];
};

export const SubjectRow: FC<SubjectRowProps> = ({ editorId }: SubjectRowProps) => {
	const { subject, setSubject } = useEditorSubject(editorId);
	const { isUrgent } = useEditorIsUrgent(editorId);
	const { requestReadReceipt } = useEditorRequestReadReceipt(editorId);

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
			padding={{ all: 'none' }}
		>
			<Container background={'gray5'} style={{ overflow: 'hidden' }} padding="0">
				<Input
					data-testid={'subject'}
					label={t('label.subject', 'Subject')}
					value={subject}
					onChange={onSubjectChange}
				/>
			</Container>
			{(requestReadReceipt || isUrgent) && (
				<Container
					width="fit"
					background={'gray5'}
					padding={{ right: 'medium', left: 'small' }}
					orientation="horizontal"
				>
					{requestReadReceipt && (
						<Tooltip label={t('label.request_receipt', 'Request read receipt')}>
							<Padding right="small">
								<Icon icon="CheckmarkSquare" color="secondary" size="large" />
							</Padding>
						</Tooltip>
					)}
					{isUrgent && (
						<Tooltip label={t('tooltip.marked_as_important', 'Marked as important')}>
							<Icon icon="ArrowUpward" color="secondary" size="large" />
						</Tooltip>
					)}
				</Container>
			)}
		</Container>
	);
};
