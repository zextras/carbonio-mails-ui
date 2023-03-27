/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	Container,
	getColor,
	Icon,
	IconButton,
	Link,
	Padding,
	Row,
	Text,
	Tooltip,
	useTheme
} from '@zextras/carbonio-design-system';
import { filter, find, map } from 'lodash';
import React, {
	FC,
	ReactElement,
	SyntheticEvent,
	useCallback,
	useMemo,
	useRef,
	useState
} from 'react';
import { useTranslation } from 'react-i18next';
import styled, { SimpleInterpolation } from 'styled-components';
import { getFileExtension } from '../../../../commons/utilities';
import { useAppDispatch } from '../../../../hooks/redux';
import { updateEditor } from '../../../../store/editor-slice';
import {
	EditorAttachmentFiles,
	IconColors,
	MailsEditor,
	ThrottledSaveToDraftType
} from '../../../../types';
import { getAttachmentIconColors, getAttachmentsLink } from '../preview/utils';

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
	editor: MailsEditor;
	part: string;
	iconColors: IconColors;
	throttledSaveToDraft: ThrottledSaveToDraftType;
	att: EditorAttachmentFiles;
};
const Attachment: FC<AttachmentType> = ({
	filename,
	size,
	link,
	editor,
	part,
	iconColors,
	throttledSaveToDraft,
	att
}) => {
	const extension = getFileExtension(att).value;
	const sizeLabel = useMemo(() => getSizeLabel(size), [size]);
	const [t] = useTranslation();
	const inputRef = useRef<HTMLAnchorElement>(null);
	const inputRef2 = useRef<HTMLAnchorElement>(null);
	const dispatch = useAppDispatch();

	const removeAttachment = useCallback(() => {
		dispatch(
			updateEditor({
				editorId: editor.editorId,
				data: {
					attach: { mp: filter(editor.attach.mp, (p) => p.part !== part) },
					attachmentFiles: filter(editor.attachmentFiles, (p) => p.name !== part)
				}
			})
		);
		throttledSaveToDraft({
			attach: { mp: filter(editor.attach.mp, (p) => p.part !== part) },
			attachmentFiles: filter(editor.attachmentFiles, (p) => p.name !== part)
		});
	}, [dispatch, editor, throttledSaveToDraft, part]);

	return (
		<AttachmentContainer
			orientation="horizontal"
			mainAlignment="flex-start"
			height="fit"
			background="gray3"
			data-testid={`attachment-container-${filename}`}
		>
			<Tooltip key={`${editor?.id}-Preview`} label={t('action.preview', 'Preview')}>
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
							key={`${editor.id}-DeletePermanentlyOutline`}
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
				href={`/service/home/~/?auth=co&id=${editor.id}&part=${part}`}
			/>
			<AttachmentLink ref={inputRef} rel="noopener" target="_blank" href={link} />
		</AttachmentContainer>
	);
};

const EditAttachmentsBlock: FC<{
	editor: MailsEditor;
	throttledSaveToDraft: (arg: any) => void;
}> = ({ editor, throttledSaveToDraft }): ReactElement => {
	const [t] = useTranslation();
	const [expanded, setExpanded] = useState(false);
	const dispatch = useAppDispatch();
	const theme = useTheme();

	const removeAllAttachments = useCallback(() => {
		dispatch(
			updateEditor({
				editorId: editor.editorId,
				data: {
					attach: { mp: [] },
					attachmentFiles: []
				}
			})
		);
		throttledSaveToDraft({
			attach: { mp: [] },
			attachmentFiles: []
		});
	}, [editor.editorId, dispatch, throttledSaveToDraft]);

	const iconColors: IconColors = getAttachmentIconColors({
		attachments: editor.attachmentFiles,
		theme
	});

	return editor.attachmentFiles.length > 0 ? (
		<Container crossAlignment="flex-start">
			<Container orientation="horizontal" mainAlignment="space-between" wrap="wrap">
				{map(
					expanded ? editor.attachmentFiles : editor.attachmentFiles.slice(0, 2),
					(att, index) => (
						<Attachment
							key={`att-${att.filename}-${index}`}
							filename={att.filename}
							size={att.size}
							link={getAttachmentsLink({
								messageId: editor.id ?? '',
								messageSubject: editor.subject,
								attachments: [att.name],
								attachmentType: att.contentType
							})}
							editor={editor}
							part={att.name}
							iconColors={iconColors}
							throttledSaveToDraft={throttledSaveToDraft}
							att={att}
						/>
					)
				)}
			</Container>
			<Row mainAlignment="flex-start" padding={{ vertical: 'extrasmall' }}>
				<Padding right="small">
					{editor.attachmentFiles.length === 1 && (
						<Text color="gray1">{`1 ${t('label.attachment', 'Attachment')}`}</Text>
					)}
					{editor.attachmentFiles.length === 2 && (
						<Text color="gray1">
							{`${editor.attachmentFiles.length} ${t('label.attachment_plural', 'Attachments')}`}
						</Text>
					)}
					{editor.attachmentFiles.length > 2 &&
						(expanded ? (
							<Row
								onClick={(): void => setExpanded(false)}
								style={{ cursor: 'pointer' }}
								data-testid="attachment-list-collapse-link"
							>
								<Padding right="small">
									<Text color="primary">
										{`${editor.attachmentFiles.length} ${t(
											'label.attachment_plural',
											'attachments'
										)}`}
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
										{`${t('label.show_all', 'Show all')} ${editor.attachmentFiles.length} ${t(
											'label.attachment_plural',
											'attachments'
										)}`}
									</Text>
								</Padding>
								<Icon icon="ArrowIosDownward" color="primary" />
							</Row>
						))}
				</Padding>
				<Link size="medium" onClick={removeAllAttachments}>
					{t('label.remove', {
						count: editor.attachmentFiles.length,
						defaultValue: 'Remove',
						defaultValuePlural: 'Remove all {{count}}'
					})}
				</Link>
			</Row>
		</Container>
	) : (
		<></>
	);
};

export default EditAttachmentsBlock;
