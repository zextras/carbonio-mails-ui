/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo, useRef } from 'react';

import styled from '@emotion/styled';
import { Dropdown, Row, Tooltip, DropdownItem, Button } from '@zextras/carbonio-design-system';
import { t, useUserSettings } from '@zextras/carbonio-shell-ui';
import { compact, noop } from 'lodash';
import { Controller, useForm } from 'react-hook-form';

import { useEditorOriginalAttachments } from '../edit-utils-hooks/use-editor-original-attachments';
import { useLocalAttachmentOrSmartlink } from '../edit-utils-hooks/use-local-attachment-or-smartlink';
import { uploadAttachmentsApi } from 'api/upload-attachments-api';
import { buildArrayFromFileList } from 'helpers/files';
import { useRegisterFilesComposerIntegrations } from 'integrations/carbonio-files-ui-composer-integration';
import { useComposerIntegrationStore } from 'store/composer-integrations/store';
import { useEditorsStore, useEditorAttachments, useEditorText } from 'store/editor';
import { MailsEditorV2 } from 'types/editor';
import { UploadedAttachment } from 'types/integrations/composer-integration';
import * as StyledComp from 'views/app/detail-panel/edit/parts/edit-view-styled-components';

const escapeHtml = (str: string): string =>
	str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const isSafeUrl = (url: string): boolean => /^https?:\/\//i.test(url);

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

	const editor = useEditorsStore((state) => state.editors[editorId]);
	const maxMessageSizeStr = useUserSettings().attrs?.zimbraMtaMaxMessageSize as string | undefined;
	const maxAllowedSize = parseInt(maxMessageSizeStr ?? '0', 10);

	// Register the built-in Files integrations. Other external modules register
	// their own integrations via getIntegratedFunction('register-composer-integration').
	useRegisterFilesComposerIntegrations();

	const integrations = useComposerIntegrationStore((state) =>
		Array.from(state.integrations.values())
	);

	const addFilesFromLocal = useCallback(
		async (fileList: FileList) => {
			const files = buildArrayFromFileList(fileList);
			addLocalFiles(files);
		},
		[addLocalFiles]
	);

	const onLocalFileClick = useCallback(() => {
		if (inputRef.current) {
			inputRef.current.value = '';
			inputRef.current.click();
		}
	}, []);

	const integrationItems = useMemo<DropdownItem[]>(
		() =>
			integrations.map(
				(config): DropdownItem => ({
					id: config.id,
					icon: config.icon,
					label: config.label,
					onClick: (): void =>
						config.onClick({
							editorId,
							getText,
							onAttachmentAdded: (att) =>
								addUploadedAttachment({
									attachmentId: att.attachmentId,
									fileName: att.name,
									contentType: att.contentType,
									size: att.size
								}),
							onLinksInserted: (links) => {
								const safeLinks = links.filter((l) => isSafeUrl(l.url));
								const current = getText();
								setText({
									plainText: `${safeLinks.map((l) => l.url).join('\n')}\n${current.plainText}`,
									richText:
										safeLinks
											.map((l) => {
												const href = escapeHtml(l.url);
												const text = escapeHtml(l.label ?? l.url);
												return `<p><a href="${href}">${text}</a></p>`;
											})
											.join('') + current.richText
								});
							},
							uploadFiles: (files: File[]): Promise<UploadedAttachment[]> => {
								if (files.length === 0) {
									return Promise.resolve([]);
								}
								return new Promise((resolve) => {
									const succeeded: UploadedAttachment[] = [];
									uploadAttachmentsApi(files, {
										onUploadComplete: (file, _uploadId, attachmentId) => {
											succeeded.push({
												attachmentId,
												name: file.name,
												contentType: file.type || 'application/octet-stream',
												size: file.size
											});
										},
										onUploadsEnd: () => resolve(succeeded)
									});
								});
							},
							currentEditorSize: editor?.size ?? 0,
							maxAllowedSize
						})
				})
			),
		[addUploadedAttachment, editor?.size, editorId, getText, integrations, maxAllowedSize, setText]
	);

	const actionsItems = useMemo<Array<DropdownItem>>(() => {
		const localFileAction: DropdownItem = {
			id: 'localAttachment',
			icon: 'MonitorOutline',
			label: t('composer.attachment.local', 'Add from local'),
			onClick: onLocalFileClick
		};

		const originalAttachmentsAction: DropdownItem | undefined = originalMessageHasAttachments
			? {
					id: 'originalAttachments',
					icon: 'AttachOutline',
					label: t('composer.attachment.add_original', 'Add original attachment(s)'),
					onClick: addOriginalAttachmentsToEditor
				}
			: undefined;

		return compact([localFileAction, ...integrationItems, originalAttachmentsAction]);
	}, [
		onLocalFileClick,
		originalMessageHasAttachments,
		addOriginalAttachmentsToEditor,
		integrationItems
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
