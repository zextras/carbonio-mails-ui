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
import { useEditorAttachments } from '../../../../store/zustand/editor';
import type { MailsEditorV2, SavedAttachment, UnsavedAttachment } from '../../../../types';

export const EditAttachmentsBlock: FC<{
	editorId: MailsEditorV2['id'];
}> = ({ editorId }): ReactElement => {
	const [expanded, setExpanded] = useState(false);
	const { savedStandardAttachments, unsavedStandardAttachments, removeStandardAttachments } =
		useEditorAttachments(editorId);

	const allAttachments = useMemo<Array<UnsavedAttachment | SavedAttachment>>(
		() => [...unsavedStandardAttachments, ...savedStandardAttachments],
		[savedStandardAttachments, unsavedStandardAttachments]
	);

	const attachmentsLabel = t('label.attachment', {
		count: allAttachments.length,
		defaultValue_one: '{{count}} attachment',
		defaultValue_other: '{{count}} attachments'
	});

	return allAttachments.length > 0 ? (
		<StyledComp.RowContainer background="gray6">
			<StyledComp.ColContainer occupyFull>
				<Container crossAlignment="flex-start">
					<Container orientation="horizontal" mainAlignment="space-between" wrap="wrap">
						{map(expanded ? allAttachments : allAttachments.slice(0, 2), (attachment, index) =>
							// FIXME: This ternary is a temporary fix. Remove once the backend is exposing the correct data
							// REF IRIS-4205
							attachment.filename !== 'unnamed' ? (
								<AttachmentPreview
									key={`att-${attachment.filename}-${index}`}
									editorId={editorId}
									attachment={attachment}
								/>
							) : (
								<></>
							)
						)}
					</Container>
					<Row mainAlignment="flex-start" padding={{ vertical: 'extrasmall' }}>
						<Padding right="small">
							{allAttachments.length > 0 && allAttachments.length <= 2 && (
								<Text color="gray1">{attachmentsLabel}</Text>
							)}
							{allAttachments.length > 2 &&
								(expanded ? (
									<Row
										onClick={(): void => setExpanded(false)}
										style={{ cursor: 'pointer' }}
										data-testid="attachment-list-collapse-link"
									>
										<Padding right="small">
											<Text color="primary">{attachmentsLabel}</Text>
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
												{t('label.show_all_attachments', {
													count: allAttachments.length,
													defaultValue_other: 'Show all {{count}} attachments'
												})}
											</Text>
										</Padding>
										<Icon icon="ArrowIosDownward" color="primary" />
									</Row>
								))}
						</Padding>
						<Link size="medium" onClick={removeStandardAttachments}>
							{t('label.remove', {
								count: allAttachments.length,
								defaultValue_one: 'Remove',
								defaultValue_other: 'Remove all {{count}}'
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
