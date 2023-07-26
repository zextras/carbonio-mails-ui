/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, SyntheticEvent, useCallback, useRef } from 'react';

import {
	Container,
	getColor,
	IconButton,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { find } from 'lodash';
import styled, { SimpleInterpolation } from 'styled-components';

import { getFileExtension } from '../../../../commons/utilities';
import { getRemoveAttachments } from '../../../../store/zustand/editor';
import { EditorAttachmentFiles, IconColors, MailsEditorV2 } from '../../../../types';

const getSizeLabel = (size: number): string => {
	let value;
	if (size < 1024000) {
		value = `${Math.round((size / 1024) * 100) / 100} KB`;
	} else if (size < 1024000000) {
		value = `${Math.round((size / 1024 / 1024) * 100) / 100} MB`;
	} else {
		value = `${Math.round((size / 1024 / 1024 / 1024) * 100) / 100} GB`;
	}
	return value;
};

const AttachmentHoverBarContainer = styled(Container)`
	display: none;
	height: 0;
`;

const AttachmentContainer = styled(Container)`
	border-radius: 0.125rem;
	width: calc(50% - 0.25rem);
	transition: 0.2s ease-out;
	margin-bottom: ${({ theme }): string => theme.sizes.padding.small};
	&:hover {
		background-color: ${({ theme, background }): SimpleInterpolation =>
			background && getColor(`${background}.hover`, theme)};
		& ${AttachmentHoverBarContainer} {
			display: flex;
		}
	}
	&:focus {
		background-color: ${({ theme, background }): SimpleInterpolation =>
			background && getColor(`${background}.focus`, theme)};
	}
	cursor: pointer;
`;

const AttachmentLink = styled.a`
	margin-bottom: ${({ theme }): string => theme.sizes.padding.small};
	position: relative;
	text-decoration: none;
`;

const AttachmentExtension = styled(Text)<{
	background: string;
}>`
	display: flex;
	justify-content: center;
	align-items: center;
	width: 2rem;
	height: 2rem;
	border-radius: ${({ theme }): string => theme.borderRadius};
	background-color: ${({ background }): string => background};
	color: ${({ theme }): string => theme.palette.gray6.regular};
	font-size: calc(${({ theme }): string => theme.sizes.font.small} - 0.125rem);
	text-transform: uppercase;
	margin-right: ${({ theme }): string => theme.sizes.padding.small};
`;
type AttachmentType = {
	filename: string;
	size: number;
	link: string;
	editorId: MailsEditorV2['id'];
	part: string;
	iconColors: IconColors;
	att: EditorAttachmentFiles;
};
export const Attachment: FC<AttachmentType> = ({
	filename,
	size,
	link,
	editorId,
	part,
	iconColors,
	att
}) => {
	const extension = getFileExtension(att).value;
	const sizeLabel = getSizeLabel(size);
	const inputRef = useRef<HTMLAnchorElement>(null);
	const inputRef2 = useRef<HTMLAnchorElement>(null);

	const removeAttachment = useCallback(() => {
		getRemoveAttachments({ id: editorId, action: part });
	}, [editorId, part]);

	return (
		<AttachmentContainer
			orientation="horizontal"
			mainAlignment="flex-start"
			height="fit"
			background="gray3"
			data-testid={`attachment-container-${filename}`}
		>
			<Tooltip key={`${editorId}-Preview`} label={t('action.preview', 'Preview')}>
				<Row
					padding={{ all: 'small' }}
					mainAlignment="flex-start"
					onClick={(ev: SyntheticEvent): void => {
						ev.preventDefault();
						if (inputRef2.current) {
							inputRef2.current.click();
						}
					}}
					takeAvailableSpace
				>
					<AttachmentExtension
						background={find(iconColors, (ic) => ic.extension === extension)?.color ?? ''}
					>
						{extension}
					</AttachmentExtension>
					<Row orientation="vertical" crossAlignment="flex-start" takeAvailableSpace>
						<Padding style={{ width: '100%' }} bottom="extrasmall">
							<Text>
								{filename ||
									t('label.attachement_unknown', {
										mimeType: att?.contentType,
										defaultValue: 'Unknown <{{mimeType}}>'
									})}
							</Text>
						</Padding>
						<Text color="gray1" size="small">
							{sizeLabel}
						</Text>
					</Row>
				</Row>
			</Tooltip>
			<Row orientation="horizontal" crossAlignment="center">
				<AttachmentHoverBarContainer>
					<Padding right="small">
						<Tooltip
							key={`${editorId}-DeletePermanentlyOutline`}
							label={t('label.delete', 'Delete')}
						>
							<IconButton
								size="medium"
								icon="DeletePermanentlyOutline"
								onClick={removeAttachment}
							/>
						</Tooltip>
					</Padding>
				</AttachmentHoverBarContainer>
			</Row>
			<AttachmentLink
				rel="noopener"
				ref={inputRef2}
				target="_blank"
				href={`/service/home/~/?auth=co&id=${editorId}&part=${part}`}
			/>
			<AttachmentLink ref={inputRef} rel="noopener" target="_blank" href={link} />
		</AttachmentContainer>
	);
};
