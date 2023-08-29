/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useMemo, useState } from 'react';

import { Container, Icon, Link, Padding, Row, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import { AttachmentPreview } from './attachment-preview';
import * as StyledComp from './parts/edit-view-styled-components';
import { getEditor, useEditorAttachments } from '../../../../store/zustand/editor';
import type { MailsEditorV2, SavedAttachment, UnsavedAttachment } from '../../../../types';

export const EditAttachmentsBlock: FC<{
	editorId: MailsEditorV2['id'];
}> = ({ editorId }): ReactElement => {
	const [expanded, setExpanded] = useState(false);
	const { savedStandardAttachments, unsavedStandardAttachments, removeStandardAttachments } =
		useEditorAttachments(editorId);
	const labelAttachmentsPlural = t('label.attachment_plural', 'Attachments');

	const allAttachments = useMemo<Array<UnsavedAttachment | SavedAttachment>>(
		() => [...unsavedStandardAttachments, ...savedStandardAttachments],
		[savedStandardAttachments, unsavedStandardAttachments]
	);

	const editor = getEditor({ id: editorId });
	console.dir(editor);

	return allAttachments.length > 0 ? (
		<StyledComp.RowContainer background="gray6">
			<StyledComp.ColContainer occupyFull>
				<Container crossAlignment="flex-start">
					<Container orientation="horizontal" mainAlignment="space-between" wrap="wrap">
						{map(expanded ? allAttachments : allAttachments.slice(0, 2), (attachment, index) => (
							<AttachmentPreview
								key={`att-${attachment.filename}-${index}`}
								editorId={editorId}
								attachment={attachment}
							/>
						))}
					</Container>
					<Row mainAlignment="flex-start" padding={{ vertical: 'extrasmall' }}>
						<Padding right="small">
							{allAttachments.length === 1 && (
								<Text color="gray1">{`1 ${t('label.attachment', 'Attachment')}`}</Text>
							)}
							{allAttachments.length === 2 && (
								<Text color="gray1">{`${allAttachments.length} ${labelAttachmentsPlural}`}</Text>
							)}
							{allAttachments.length > 2 &&
								(expanded ? (
									<Row
										onClick={(): void => setExpanded(false)}
										style={{ cursor: 'pointer' }}
										data-testid="attachment-list-collapse-link"
									>
										<Padding right="small">
											<Text color="primary">
												{`${allAttachments.length} ${labelAttachmentsPlural}`}
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
													allAttachments.length
												} ${labelAttachmentsPlural}`}
											</Text>
										</Padding>
										<Icon icon="ArrowIosDownward" color="primary" />
									</Row>
								))}
						</Padding>
						<Link size="medium" onClick={removeStandardAttachments}>
							{t('label.remove', {
								count: allAttachments.length,
								defaultValue: 'Remove',
								defaultValuePlural: 'Remove all {{count}}'
							})}
						</Link>
					</Row>
				</Container>
			</StyledComp.ColContainer>
		</StyledComp.RowContainer>
	) : (
		<></>
	);
};
