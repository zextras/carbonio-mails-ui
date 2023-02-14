/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Row, Text } from '@zextras/carbonio-design-system';
import { t, useIntegratedComponent, useUserSettings } from '@zextras/carbonio-shell-ui';
import React, {
	FC,
	ReactElement,
	SyntheticEvent,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import { Controller, useForm } from 'react-hook-form';
import { normalizeMailMessageFromSoap } from '../../../../../normalizations/normalize-message';
import { EditViewContextType, MailsEditor, SaveDraftResponse } from '../../../../../types';
import { addInlineAttachments, getConvertedImageSources } from '../add-inline-attachment';
import { EditViewContext } from './edit-view-context';
import * as StyledComp from './edit-view-styled-components';

type PropType = {
	onDragOverEvent: (event: SyntheticEvent) => void;
	draftSavedAt: string;
	minHeight: number;
	setValue: (name: string, value: any) => void;
	updateEditorCb: (data: Partial<MailsEditor>) => void;
	updateSubjectField: (mod: Partial<MailsEditor>) => void;
	saveDraftCb: (data: MailsEditor, signal?: AbortSignal) => SaveDraftResponse;
	textValue: [string, string];
};

type FileSelectProps = {
	editor: MailsEditor;
	files: File[];
};
const TextEditorContainer: FC<PropType> = ({
	onDragOverEvent,
	draftSavedAt,
	minHeight,
	setValue,
	updateEditorCb,
	updateSubjectField,
	saveDraftCb,
	textValue
}) => {
	const { control } = useForm();
	const { editor, throttledSaveToDraft } = useContext<EditViewContextType>(EditViewContext);
	const [Composer, composerIsAvailable] = useIntegratedComponent('composer');

	const { prefs } = useUserSettings();

	const defaultFontFamily = useMemo<string>(
		() => String(prefs?.zimbraPrefHtmlEditorDefaultFontFamily) ?? 'sans-serif',
		[prefs]
	);
	const [inputValue, setInputValue] = useState(editor?.text ?? ['', '']);
	const timeoutRef = useRef<null | ReturnType<typeof setTimeout>>(null);
	const [showStickyTime, setStickyTime] = useState(false);
	const [isReady, setIsReady] = useState(false);
	const toggleStickyTime = useCallback(() => {
		clearTimeout(timeoutRef.current as ReturnType<typeof setTimeout>);
		setStickyTime(false);
		timeoutRef.current = setTimeout(() => {
			setStickyTime(true);
			setTimeout(() => {
				setStickyTime(false);
			}, 1500);
		}, 1500);
	}, []);

	useEffect(() => {
		setInputValue(textValue);
	}, [textValue]);

	useEffect(() => {
		const controller = new AbortController();
		const { signal } = controller;
		if (isReady) {
			saveDraftCb(
				{
					...editor,
					text: inputValue
				},
				signal
			).then((res: SaveDraftResponse) => {
				if (res.payload.resp.m) {
					setIsReady(false);
					getConvertedImageSources({
						message: normalizeMailMessageFromSoap(res?.payload?.resp?.m?.[0]),
						updateEditorCb,
						setValue,
						setInputValue,
						inputValue
					});
				}
			});
		}
		return () => {
			controller.abort();
		};
	}, [editor, inputValue, isReady, saveDraftCb, setValue, updateEditorCb]);

	return (
		<>
			{editor?.text && (
				<Container
					height="fit"
					padding={{ all: 'small' }}
					background="gray6"
					crossAlignment="flex-end"
				>
					{editor?.richText && composerIsAvailable ? (
						<Container
							background="gray6"
							mainAlignment="flex-start"
							style={{ minHeight, overflow: 'hidden' }}
						>
							<StyledComp.EditorWrapper data-testid="MailEditorWrapper">
								<Composer
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									value={inputValue[1]}
									disabled={isReady}
									onFileSelect={({ editor: tinymce, files }: FileSelectProps): void => {
										addInlineAttachments({
											files,
											tinymce,
											updateEditorCb,
											setIsReady,
											editor
										});
									}}
									onEditorChange={(ev: [string, string]): void => {
										setInputValue(ev);
										updateSubjectField({ text: ev });
										throttledSaveToDraft({ text: ev });
										toggleStickyTime();
									}}
									onDragOver={onDragOverEvent}
								/>
							</StyledComp.EditorWrapper>
						</Container>
					) : (
						<Controller
							name="text"
							control={control}
							defaultValue={inputValue}
							render={({ onChange }): ReactElement => (
								<Container background="gray6" height="fit">
									<StyledComp.TextArea
										data-testid="MailPlainTextEditor"
										value={inputValue[0]}
										style={{ fontFamily: defaultFontFamily }}
										onChange={(ev): void => {
											// eslint-disable-next-line no-param-reassign
											ev.target.style.height = 'auto';
											// eslint-disable-next-line no-param-reassign
											ev.target.style.height = `${25 + ev.target.scrollHeight}px`;
											const data: [string, string] = [
												ev.target.value,
												`${
													editor?.text[1] ? `${editor.text[1]}${ev.target.value}` : ev.target.value
												}`
											];

											throttledSaveToDraft({ text: data });
											updateSubjectField({ text: data });
											onChange(data);
											setInputValue(data);
											toggleStickyTime();
										}}
									/>
								</Container>
							)}
						/>
					)}
					{draftSavedAt && showStickyTime && (
						<StyledComp.StickyTimeContainer>
							<StyledComp.StickyTime>
								<Row
									crossAlignment="flex-end"
									background="gray5"
									padding={{ vertical: 'medium', horizontal: 'large' }}
								>
									<Text size="extrasmall" color="secondary">
										{t('message.email_saved_at', {
											time: draftSavedAt,
											defaultValue: 'Email saved as draft at {{time}}'
										})}
									</Text>
								</Row>
							</StyledComp.StickyTime>
						</StyledComp.StickyTimeContainer>
					)}
					<StyledComp.Divider />
				</Container>
			)}
		</>
	);
};

export default TextEditorContainer;
