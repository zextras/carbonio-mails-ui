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
	DropdownItem,
	useModal
} from '@zextras/carbonio-design-system';
import { getIntegratedFunction, t, useUserSettings } from '@zextras/carbonio-shell-ui';
import { compact, map, noop } from 'lodash';
import { Controller, useForm } from 'react-hook-form';
import styled from 'styled-components';

import { SmartlinkFromFilesModal } from './smartlink-modal/smartlink-from-files-modal';
import { SmartlinkFromLocalModal } from './smartlink-modal/smartlink-from-local-modal';
import { buildArrayFromFileList } from 'helpers/files';
import { isFulfilled } from 'helpers/promises';
import { useEditorAttachments, useEditorsStore, useEditorText } from 'store/editor/index';
import { MailsEditorV2 } from 'types/index.d';
import {
	useGetPublicUrl,
	UseGetPublicUrlRespType
} from 'views/app/detail-panel/edit/edit-utils-hooks/use-get-public-url';
import {
	FileNode,
	useUploadFromFiles,
	UseUploadFromFilesResult
} from 'views/app/detail-panel/edit/edit-utils-hooks/use-upload-from-files';
import * as StyledComp from 'views/app/detail-panel/edit/parts/edit-view-styled-components';

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

	const { getText, setText } = useEditorText(editorId);
	const { addStandardAttachments, addUploadedAttachment } = useEditorAttachments(editorId);

	const editor = useEditorsStore((state) => state.editors[editorId]);
	const maxMessageSize = useUserSettings().attrs?.zimbraMtaMaxMessageSize;
	const maxAllowedMailSize = parseInt(maxMessageSize as string, 10);
	const { createModal, closeModal } = useModal();

	const addFilesFromLocal = useCallback(
		async (fileList: FileList) => {
			const files = buildArrayFromFileList(fileList);

			const filesSize = files.reduce((acc, file) => acc + file.size, 0);
			const base64conversionRate = 1.33;
			const calculatedEditorSizeWithFiles = editor.size + filesSize * base64conversionRate;
			const modalId = 'convertToSmartlinkModal';
			if (calculatedEditorSizeWithFiles < maxAllowedMailSize) {
				addStandardAttachments(files, {});
			} else {
				createModal(
					{
						id: modalId,
						maxHeight: '90vh',
						size: 'medium',
						children: (
							<SmartlinkFromLocalModal
								onClose={(): void => closeModal(modalId)}
								files={files}
								editorId={editorId}
							/>
						)
					},
					true
				);
			}
		},
		[addStandardAttachments, closeModal, createModal, editor, editorId, maxAllowedMailSize]
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
		(filesResponse: UseGetPublicUrlRespType[]) => {
			const textWithLink = {
				plainText: map(filesResponse, (i: { value: { url: string } }) => i.value.url)
					.join('\n')
					.concat(getText().plainText),
				richText: ` ${map(
					filesResponse,
					(i: { value: { url: string } }) => `<p><a href="${i.value.url}"> ${i.value.url}</a></p>`
				).join('')}`.concat(getText().richText)
			};
			setText(textWithLink);
		},
		[setText, getText]
	);

	const [getLink, isGetLinkAvailable] = useGetPublicUrl({ addPublicLinkFromFiles });
	const [uploadFromFiles, isUploadFromFiles] = useUploadFromFiles({
		onComplete: onUploadFromFilesComplete
	});

	const addFilesFromFiles = useCallback(
		async (fileNodes: Array<FileNode>) => {
			const filesSize = fileNodes.reduce((acc, file) => acc + file.size, 0);
			const base64conversionRate = 1.33;
			const calculatedEditorSizeWithFiles = editor.size + filesSize * base64conversionRate;
			const modalId = 'convertToSmartlinkModal';
			if (calculatedEditorSizeWithFiles < maxAllowedMailSize) {
				return uploadFromFiles(fileNodes);
			}
			createModal(
				{
					id: modalId,
					maxHeight: '90vh',
					size: 'medium',
					children: (
						<SmartlinkFromFilesModal
							onClose={(): void => closeModal(modalId)}
							fileNodes={fileNodes}
							editorId={editorId}
						/>
					)
				},
				true
			);
			return noop;
		},
		[closeModal, createModal, editor, editorId, maxAllowedMailSize, uploadFromFiles]
	);

	const [selectNodes, isSelectNodesAvailable] = getIntegratedFunction('select-nodes');

	const uploadFromFilesSelectionConfig = useMemo(
		() => ({
			title: t('label.choose_file', 'Choose file'),
			confirmAction: addFilesFromFiles,
			confirmLabel: t('label.select', 'Select'),
			allowFiles: true,
			allowFolders: false
		}),
		[addFilesFromFiles]
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
				<Dropdown items={actionsItems} display="inline-block">
					<StyledComp.ResizedIconCheckbox onChange={(): null => null} icon="AttachOutline" />
				</Dropdown>
			</Tooltip>
		</SelectorContainer>
	);
};
