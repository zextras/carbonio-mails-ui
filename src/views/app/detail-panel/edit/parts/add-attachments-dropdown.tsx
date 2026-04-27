/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo, useRef } from 'react';

import styled from '@emotion/styled';
import { Dropdown, Row, Tooltip, DropdownItem, Button } from '@zextras/carbonio-design-system';
import { getIntegratedFunction, t } from '@zextras/carbonio-shell-ui';
import { compact, map, noop } from 'lodash';
import { Controller, useForm } from 'react-hook-form';

import { useEditorAddAttachmentProviders } from '../edit-utils-hooks/use-editor-add-attachment-providers';
import { useEditorOriginalAttachments } from '../edit-utils-hooks/use-editor-original-attachments';
import { useFilesAttachmentOrSmartlink } from '../edit-utils-hooks/use-files-attachment-or-smartlink';
import { useLocalAttachmentOrSmartlink } from '../edit-utils-hooks/use-local-attachment-or-smartlink';
import { buildArrayFromFileList } from 'helpers/files';
import { isFulfilled } from 'helpers/promises';
import { useEditorAttachments, useEditorText } from 'store/editor/index';
import { MailsEditorV2 } from 'types/editor';
import {
	useGetPublicUrl,
	UseGetPublicUrlRespType
} from 'views/app/detail-panel/edit/edit-utils-hooks/use-get-public-url';
import {
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
	const { addUploadedAttachment } = useEditorAttachments(editorId);
	const { addLocalFiles } = useLocalAttachmentOrSmartlink({ editorId });
	const { originalMessageHasAttachments, addOriginalAttachmentsToEditor } =
		useEditorOriginalAttachments({ editorId });

	const addFilesFromLocal = useCallback(
		async (fileList: FileList) => {
			const files = buildArrayFromFileList(fileList);
			addLocalFiles(files);
		},
		[addLocalFiles]
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

	const { addFilesFromFiles } = useFilesAttachmentOrSmartlink({
		editorId,
		onUploadFiles: uploadFromFiles
	});

	const externalProviders = useEditorAddAttachmentProviders({ editorId });

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
			onClick: onLocalFileClick
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

		const originalAttachmentsAction: DropdownItem | undefined = originalMessageHasAttachments
			? {
					id: 'originalAttachments',
					icon: 'AttachOutline',
					label: t('composer.attachment.add_original', 'Add original attachment(s)'),
					onClick: addOriginalAttachmentsToEditor
				}
			: undefined;

		const externalActions: Array<DropdownItem> = externalProviders.map((provider) => ({
			id: provider.id,
			label: provider.label,
			icon: provider.icon,
			onClick: (): void => {
				provider.execute();
			}
		}));

		return compact([
			localFileAction,
			filesNodeAction,
			filesLinkAction,
			...externalActions,
			originalAttachmentsAction
		]);
	}, [
		onLocalFileClick,
		originalMessageHasAttachments,
		addOriginalAttachmentsToEditor,
		isUploadFromFiles,
		uploadFromFilesSelectionConfig,
		isSelectNodesAvailable,
		isGetLinkAvailable,
		selectNodes,
		getPublicLinkSelectionConfig,
		externalProviders
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
				<Dropdown disableAutoFocus items={actionsItems} display="inline-block">
					<Button size="large" icon="AttachOutline" onClick={noop} type={'ghost'} color={'gray0'} />
				</Dropdown>
			</Tooltip>
		</SelectorContainer>
	);
};
