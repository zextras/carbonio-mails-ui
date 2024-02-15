/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo, useRef } from 'react';

import { Dropdown, Row, Text, Tooltip, Icon, Padding } from '@zextras/carbonio-design-system';
import { getIntegratedFunction, t } from '@zextras/carbonio-shell-ui';
import { compact, map } from 'lodash';
import { Controller, useForm } from 'react-hook-form';
import styled from 'styled-components';

import * as StyledComp from './edit-view-styled-components';
import { buildArrayFromFileList } from '../../../../../helpers/files';
import { useEditorAttachments, useEditorText } from '../../../../../store/zustand/editor';
import { MailsEditorV2 } from '../../../../../types';
import { useGetFilesFromDrive } from '../edit-utils-hooks/use-get-drive-files';
import { useGetPublicUrl } from '../edit-utils-hooks/use-get-public-url';

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
	const inputRef = useRef<any>();

	const { text, setText } = useEditorText(editorId);
	const { addStandardAttachments, addUploadedAttachment } = useEditorAttachments(editorId);

	const addFilesFromLocal = useCallback(
		(fileList: FileList) => {
			const files = buildArrayFromFileList(fileList);
			addStandardAttachments(files, {});
		},
		[addStandardAttachments]
	);

	const addFilesFromFiles = useCallback(
		(filesNode: Promise<{ attachmentId: string }>) => {
			// TODO handle files response and update attachment in Editor store
			filesNode
				.then(({ attachmentId }) => {
					addUploadedAttachment(attachmentId);
				})
				.catch((err) => {
					// TODO handlererror
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

	const [getFilesFromDrive, getFilesAvailable] = useGetFilesFromDrive({ addFilesFromFiles });
	const [getLink, getLinkAvailable] = useGetPublicUrl({ addPublicLinkFromFiles });
	const [getFilesAction, getFilesActionAvailable] = getIntegratedFunction('select-nodes');

	const actionTarget = useMemo(
		() => ({
			title: t('label.choose_file', 'Choose file'),
			confirmAction: getFilesFromDrive,
			confirmLabel: t('label.select', 'Select'),
			allowFiles: true,
			allowFolders: false
		}),
		[getFilesFromDrive]
	);

	const actionURLTarget = useMemo(
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
			inputRef.current.value = null;
			inputRef.current.click();
		}
	}, []);

	const actionsItems = useMemo(() => {
		const localFileAction = {
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

		const contactCardAction = {
			id: 'contactsModAttachment',
			icon: 'ContactsModOutline',
			label: t('composer.attachment.contacts_mod', 'Add Contact Card'),
			onClick: (): void => undefined,
			disabled: true
		};

		const filesNodeAction =
			getFilesActionAvailable && getFilesAvailable
				? {
						id: 'driveItem',
						label: t('composer.attachment.files', 'Add from Files'),
						icon: 'DriveOutline',
						onClick: (): void => {
							getFilesAction(actionTarget);
						}
				  }
				: undefined;

		const filesLinkAction =
			getFilesActionAvailable && getLinkAvailable
				? {
						id: 'fileUrl',
						label: t('composer.attachment.url', 'Add public link from Files'),
						icon: 'Link2',
						onClick: (): void => {
							getFilesAction(actionURLTarget);
						}
				  }
				: undefined;

		return compact([localFileAction, filesNodeAction, filesLinkAction, contactCardAction]);
	}, [
		onLocalFileClick,
		getFilesAvailable,
		actionTarget,
		getFilesActionAvailable,
		getLinkAvailable,
		getFilesAction,
		actionURLTarget
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
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						ref={inputRef}
						data-testid="file-input"
						onChange={(): void => {
							addFilesFromLocal && addFilesFromLocal(inputRef?.current?.files);
						}}
						multiple
					/>
				)}
			/>
			<Tooltip label={t('tooltip.add_attachments', 'Add attachments')}>
				<Dropdown
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					items={actionsItems}
					display="inline-block"
					width="fit"
				>
					<StyledComp.ResizedIconCheckbox onChange={(): null => null} icon="AttachOutline" />
				</Dropdown>
			</Tooltip>
		</SelectorContainer>
	);
};
