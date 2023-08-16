/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, SyntheticEvent, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useIntegratedComponent, useUserSettings } from '@zextras/carbonio-shell-ui';
import type { TinyMCE } from 'tinymce/tinymce';

import * as StyledComp from './edit-view-styled-components';
import { plainTextToHTML } from '../../../../../commons/mail-message-renderer';

export type TextEditorContent = { plainText: string; richText: string };

export type TextEditorContainerProps = {
	onDragOver: (event: SyntheticEvent) => void;
	onFilesSelected: ({ editor, files }: { editor: TinyMCE; files: File[] }) => void;
	onContentChanged: (content: TextEditorContent) => void;
	richTextMode: boolean;
	content: TextEditorContent;
	minHeight: number;
	disabled: boolean;
	// draftSavedAt: string;
	// minHeight: number;
	// setValue: (name: string, value: any) => void;
	// updateEditorCb: (data: Partial<MailsEditor>) => void;
	// updateSubjectField: (mod: Partial<MailsEditor>) => void;
	// saveDraftCb: (data: MailsEditor, signal?: AbortSignal) => SaveDraftResponse;
	// textValue: [string, string];
};

export const TextEditorContainer: FC<TextEditorContainerProps> = ({
	onDragOver,
	onFilesSelected,
	onContentChanged,
	minHeight,
	content,
	richTextMode,
	disabled
}) => {
	const [Composer, composerIsAvailable] = useIntegratedComponent('composer');

	const { prefs } = useUserSettings();
	const defaultFontFamily = useMemo<string>(
		() => String(prefs?.zimbraPrefHtmlEditorDefaultFontFamily) ?? 'sans-serif',
		[prefs]
	);

	// const [inputValue, setInputValue] = useState(editor?.text ?? ['', '']);
	// const timeoutRef = useRef<null | ReturnType<typeof setTimeout>>(null);
	// const [showStickyTime, setStickyTime] = useState(false);
	// const [isReady, setIsReady] = useState(false);
	// const toggleStickyTime = useCallback(() => {
	// 	clearTimeout(timeoutRef.current as ReturnType<typeof setTimeout>);
	// 	setStickyTime(false);
	// 	timeoutRef.current = setTimeout(() => {
	// 		setStickyTime(true);
	// 		setTimeout(() => {
	// 			setStickyTime(false);
	// 		}, 1500);
	// 	}, 1500);
	// }, []);
	//
	// useEffect(() => {
	// 	setInputValue(textValue);
	// }, [textValue]);
	//
	// useEffect(() => {
	// 	const controller = new AbortController();
	// 	const { signal } = controller;
	// 	if (isReady) {
	// 		saveDraftCb(
	// 			{
	// 				...editor,
	// 				text: inputValue
	// 			},
	// 			signal
	// 		).then((res: SaveDraftResponse) => {
	// 			if (res.payload.resp.m) {
	// 				setIsReady(false);
	// 				getConvertedImageSources({
	// 					message: normalizeMailMessageFromSoap(res?.payload?.resp?.m?.[0]),
	// 					updateEditorCb,
	// 					setValue,
	// 					setInputValue,
	// 					inputValue
	// 				});
	// 			}
	// 		});
	// 	}
	// 	return () => {
	// 		controller.abort();
	// 	};
	// }, [editor, inputValue, isReady, saveDraftCb, setValue, updateEditorCb]);

	return (
		<>
			{content && (
				<Container
					height="fit"
					padding={{ all: 'small' }}
					background="gray6"
					crossAlignment="flex-end"
				>
					{richTextMode && composerIsAvailable ? (
						<Container
							background="gray6"
							mainAlignment="flex-start"
							style={{ minHeight, overflow: 'hidden' }}
						>
							<StyledComp.EditorWrapper data-testid="MailEditorWrapper">
								<Composer
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									value={content.richText}
									disabled={disabled}
									onFileSelect={onFilesSelected}
									// onFileSelect={({ editor: tinymce, files }: FileSelectProps): void => {
									// 	addInlineAttachments({
									// 		files,
									// 		tinymce,
									// 		updateEditorCb,
									// 		setIsReady,
									// 		editor
									// 	});
									// }}
									onEditorChange={(ev: [string, string]): void => {
										onContentChanged({ plainText: ev[0], richText: ev[1] });
									}}
									onDragOver={onDragOver}
									customInitOptions={{
										toolbar_sticky: true
									}}
								/>
							</StyledComp.EditorWrapper>
						</Container>
					) : (
						<Container background="gray6" height="fit">
							<StyledComp.TextArea
								data-testid="MailPlainTextEditor"
								value={content.plainText}
								style={{ fontFamily: defaultFontFamily }}
								onFocus={(ev): void => {
									ev.currentTarget.setSelectionRange(0, null);
								}}
								onChange={(ev): void => {
									onContentChanged({
										plainText: ev.target.value,
										richText: plainTextToHTML(ev.target.value)
									});
									// // eslint-disable-next-line no-param-reassign
									// ev.target.style.height = 'auto';
									// // eslint-disable-next-line no-param-reassign
									// ev.target.style.height = `${25 + ev.target.scrollHeight}px`;
									// const data: [string, string] = [
									// 	ev.target.value,
									// 	`${editor?.text[1] ? `${editor.text[1]}${ev.target.value}` : ev.target.value}`
									// ];
									//
									// throttledSaveToDraft({ text: data });
									// updateSubjectField({ text: data });
									// onChange(data);
									// setInputValue(data);
									// toggleStickyTime();
								}}
							/>
						</Container>
					)}
					{/* {draftSavedAt && showStickyTime && ( */}
					{/*	<StyledComp.StickyTimeContainer> */}
					{/*		<StyledComp.StickyTime> */}
					{/*			<Row */}
					{/*				crossAlignment="flex-end" */}
					{/*				background="gray5" */}
					{/*				padding={{ vertical: 'medium', horizontal: 'large' }} */}
					{/*			> */}
					{/*				<Text size="extrasmall" color="secondary"> */}
					{/*					{t('message.email_saved_at', { */}
					{/*						time: draftSavedAt, */}
					{/*						defaultValue: 'Email saved as draft at {{time}}' */}
					{/*					})} */}
					{/*				</Text> */}
					{/*			</Row> */}
					{/*		</StyledComp.StickyTime> */}
					{/*	</StyledComp.StickyTimeContainer> */}
					{/* )} */}
				</Container>
			)}
		</>
	);
};
