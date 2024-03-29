/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo, useRef } from 'react';

import {
	Dropdown,
	Row,
	Text,
	Tooltip,
	Icon,
	Padding,
	DropdownItem
} from '@zextras/carbonio-design-system';
import { getIntegratedFunction, t } from '@zextras/carbonio-shell-ui';
import { compact, map } from 'lodash';
import { Controller, useForm } from 'react-hook-form';
import styled from 'styled-components';

import * as StyledComp from './edit-view-styled-components';
import { buildArrayFromFileList } from '../../../../../helpers/files';
import { isFulfilled } from '../../../../../helpers/promises';
import { useEditorAttachments, useEditorText } from '../../../../../store/zustand/editor';
import { MailsEditorV2 } from '../../../../../types';
import { useGetPublicUrl } from '../edit-utils-hooks/use-get-public-url';
import {
	useUploadFromFiles,
	UseUploadFromFilesResult
} from '../edit-utils-hooks/use-upload-from-files';

const SelectorContainer = styled(Row)`
	border-radius: 4px;
	cursor: pointer;
	&:hover {
		background-color: ${({ theme }): string => theme.palette.gray6.focus};
	}
`;

export type AddAttachmentsDropdownProps = {
	editorId: MailsEditorV2['id'];
};

export const AddAttachmentsDropdown: FC<AddAttachmentsDropdownProps> = ({ editorId }) => {
	const { control } = useForm();
	const inputRef = useRef<HTMLInputElement>(null);

	const { text, setText } = useEditorText(editorId);
	const { addStandardAttachments, addUploadedAttachment } = useEditorAttachments(editorId);

	const addFilesFromLocal = useCallback(
		(fileList: FileList) => {
			const files = buildArrayFromFileList(fileList);
			addStandardAttachments(files, {});
		},
		[addStandardAttachments]
	);

	const onUploadFromFilesComplete = useCallback(
		(filesNodes: UseUploadFromFilesResult) => {
			filesNodes.forEach((filesNode) => {
				isFulfilled(filesNode) &&
					addUploadedAttachment({
						attachmentId: filesNode.value.attachmentId,
						fileName: filesNode.value.fileName,
						contentType: filesNode.value.contentType,
						size: filesNode.value.size
					});
			});
		},
		[addUploadedAttachment]
	);

	const addPublicLinkFromFiles = useCallback(
		(filesResponse) => {
			const textWithLink = {
				plainText: map(filesResponse, (i: { value: { url: string } }) => i.value.url)
					.join('\n')
					.concat(text.plainText),
				richText: ` ${map(
					filesResponse,
					(i: { value: { url: string } }) => `<p><a href="${i.value.url}"> ${i.value.url}</a></p>`
				).join('')}`.concat(text.richText)
			};
			setText(textWithLink);
		},
		[setText, text]
	);

	const [uploadFromFiles, isUploadFromFiles] = useUploadFromFiles({
		onComplete: onUploadFromFilesComplete
	});
	const [getLink, isGetLinkAvailable] = useGetPublicUrl({ addPublicLinkFromFiles });
	const [selectNodes, isSelectNodesAvailable] = getIntegratedFunction('select-nodes');

	const uploadFromFilesSelectionConfig = useMemo(
		() => ({
			title: t('label.choose_file', 'Choose file'),
			confirmAction: uploadFromFiles,
			confirmLabel: t('label.select', 'Select'),
			allowFiles: true,
			allowFolders: false
		}),
		[uploadFromFiles]
	);

	const getPublicLinkSelectionConfig = useMemo(
		() => ({
			title: t('label.choose_file', 'Choose file'),
			confirmAction: getLink,
			confirmLabel: t('label.share_public_link', 'Share Public Link'),
			allowFiles: true,
			allowFolders: false
		}),
		[getLink]
	);

	const onLocalFileClick = useCallback(() => {
		if (inputRef.current) {
			inputRef.current.value = '';
			inputRef.current.click();
		}
	}, []);

	const actionsItems = useMemo<Array<DropdownItem>>(() => {
		const localFileAction: DropdownItem = {
			id: 'localAttachment',
			icon: 'MonitorOutline',
			label: t('composer.attachment.local', 'Add from local'),
			onClick: onLocalFileClick,
			customComponent: (
				<>
					<Icon icon="MonitorOutline" size="medium" />
					<Padding horizontal="extrasmall" />
					<Text>{t('composer.attachment.local', 'Add from local')}</Text>
				</>
			)
		};

		const filesNodeAction: DropdownItem | undefined =
			isSelectNodesAvailable && isUploadFromFiles
				? {
						id: 'driveItem',
						label: t('composer.attachment.files', 'Add from Files'),
						icon: 'DriveOutline',
						onClick: (): void => {
							selectNodes(uploadFromFilesSelectionConfig);
						}
					}
				: undefined;

		const filesLinkAction: DropdownItem | undefined =
			isSelectNodesAvailable && isGetLinkAvailable
				? {
						id: 'fileUrl',
						label: t('composer.attachment.url', 'Add public link from Files'),
						icon: 'Link2',
						onClick: (): void => {
							selectNodes(getPublicLinkSelectionConfig);
						}
					}
				: undefined;

		return compact([localFileAction, filesNodeAction, filesLinkAction]);
	}, [
		onLocalFileClick,
		isUploadFromFiles,
		uploadFromFilesSelectionConfig,
		isSelectNodesAvailable,
		isGetLinkAvailable,
		selectNodes,
		getPublicLinkSelectionConfig
	]);

	return (
		<SelectorContainer orientation="horizontal" mainAlignment="space-between">
			<Controller
				name="attach"
				control={control}
				defaultValue={{}}
				render={(): ReactElement => (
					<StyledComp.FileInput
						type="file"
						ref={inputRef}
						data-testid="file-input"
						onChange={(): void => {
							addFilesFromLocal &&
								inputRef?.current?.files &&
								addFilesFromLocal(inputRef.current.files);
						}}
						multiple
					/>
				)}
			/>
			<Tooltip label={t('tooltip.add_attachments', 'Add attachments')}>
				<Dropdown items={actionsItems} display="inline-block" width="fit">
					<StyledComp.ResizedIconCheckbox onChange={(): null => null} icon="AttachOutline" />
				</Dropdown>
			</Tooltip>
		</SelectorContainer>
	);
};
