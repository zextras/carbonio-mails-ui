/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useState } from 'react';

import {
	Container,
	Icon,
	Link,
	Padding,
	Row,
	Text,
	useTheme
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import { Attachment } from './attachment';
import {
	getClearAttachments,
	useEditorAttachmentFiles,
	useEditorSubject
} from '../../../../store/zustand/editor';
import type { IconColors, MailsEditorV2 } from '../../../../types';
import { getAttachmentIconColors, getAttachmentsLink } from '../preview/utils';

export const EditAttachmentsBlock: FC<{
	editorId: MailsEditorV2['id'];
}> = ({ editorId }): ReactElement => {
	const [expanded, setExpanded] = useState(false);
	const theme = useTheme();
	const { subject } = useEditorSubject(editorId);
	const attachmentFiles = useEditorAttachmentFiles({ id: editorId });
	const labelAttachmentsPlural = t('label.attachment_plural', 'Attachments');
	const iconColors: IconColors = getAttachmentIconColors({
		attachments: attachmentFiles,
		theme
	});

	const removeAllAttachments = (): void => {
		getClearAttachments({ id: editorId });
	};
	return (
		<Container crossAlignment="flex-start">
			<Container orientation="horizontal" mainAlignment="space-between" wrap="wrap">
				{map(expanded ? attachmentFiles : attachmentFiles.slice(0, 2), (att, index) => (
					<Attachment
						key={`att-${att.filename}-${index}`}
						filename={att.filename ?? ''}
						size={att.size}
						link={getAttachmentsLink({
							messageId: editorId ?? '',
							messageSubject: subject,
							attachments: [att.name],
							attachmentType: att.contentType
						})}
						editorId={editorId}
						part={att.name}
						iconColors={iconColors}
						att={att}
						uploadProgress={att.uploadProgress}
					/>
				))}
			</Container>
			<Row mainAlignment="flex-start" padding={{ vertical: 'extrasmall' }}>
				<Padding right="small">
					{attachmentFiles.length === 1 && (
						<Text color="gray1">{`1 ${t('label.attachment', 'Attachment')}`}</Text>
					)}
					{attachmentFiles.length === 2 && (
						<Text color="gray1">{`${attachmentFiles.length} ${labelAttachmentsPlural}`}</Text>
					)}
					{attachmentFiles.length > 2 &&
						(expanded ? (
							<Row
								onClick={(): void => setExpanded(false)}
								style={{ cursor: 'pointer' }}
								data-testid="attachment-list-collapse-link"
							>
								<Padding right="small">
									<Text color="primary">
										{`${attachmentFiles.length} ${labelAttachmentsPlural}`}
									</Text>
								</Padding>
								<Icon icon="ArrowIosUpward" color="primary" />
							</Row>
						) : (
							<Row
								onClick={(): void => setExpanded(true)}
								style={{ cursor: 'pointer' }}
								data-testid="attachment-list-expand-link"
							>
								<Padding right="small">
									<Text color="primary">
										{`${t('label.show_all', 'Show all')} ${
											attachmentFiles.length
										} ${labelAttachmentsPlural}`}
									</Text>
								</Padding>
								<Icon icon="ArrowIosDownward" color="primary" />
							</Row>
						))}
				</Padding>
				<Link size="medium" onClick={removeAllAttachments}>
					{t('label.remove', {
						count: attachmentFiles.length,
						defaultValue: 'Remove',
						defaultValuePlural: 'Remove all {{count}}'
					})}
				</Link>
			</Row>
		</Container>
	);
};
