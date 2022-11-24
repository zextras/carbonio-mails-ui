/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { t, useIntegratedComponent, useUserSettings } from '@zextras/carbonio-shell-ui';
import React, {
	RefObject,
	SyntheticEvent,
	FC,
	ReactElement,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
	useEffect
} from 'react';
import { Row, Container, Text } from '@zextras/carbonio-design-system';
import { Controller } from 'react-hook-form';
import { EditViewContext } from './edit-view-context';
import * as StyledComp from './edit-view-styled-components';
import { addInlineAttachments, getConvertedImageSources } from '../add-inline-attachment';
import { normalizeMailMessageFromSoap } from '../../../../../normalizations/normalize-message';

type PropType = {
	onDragOverEvent: (event: SyntheticEvent) => void;
	draftSavedAt: string;
	minHeight: number;
	setValue: (name: string, value: any) => void;
};

type FileSelectProps = {
	editor: any;
	files: File[];
};
const TextEditorContainer: FC<PropType> = ({
	onDragOverEvent,
	draftSavedAt,
	minHeight,
	setValue
}) => {
	const { control, editor, throttledSaveToDraft, updateSubjectField, updateEditorCb, saveDraftCb } =
		useContext(EditViewContext);
	const [Composer, composerIsAvailable] = useIntegratedComponent('composer');

	const { prefs } = useUserSettings();

	const defaultFontFamily = useMemo<string>(
		// TODO: Once the Typescript branch is merged it can be removed
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		() => prefs?.zimbraPrefHtmlEditorDefaultFontFamily ?? 'sans-serif',
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
		if (isReady) {
			saveDraftCb({
				...editor,
				text: inputValue
			}).then((res: any) => {
				setIsReady(false);
				getConvertedImageSources({
					message: normalizeMailMessageFromSoap(res?.payload?.resp?.m?.[0]),
					updateEditorCb,
					setValue,
					setInputValue,
					inputValue
				});
			});
		}
	}, [inputValue, editor, saveDraftCb, isReady, updateEditorCb, setValue]);

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
									onEditorChange={(ev: Array<string>): void => {
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
							defaultValue={editor?.text}
							render={({ onChange, value }): ReactElement => (
								<Container background="gray6" height="fit">
									<StyledComp.TextArea
										data-testid="MailPlainTextEditor"
										value={value[0]}
										style={{ fontFamily: defaultFontFamily }}
										onChange={(ev): void => {
											// eslint-disable-next-line no-param-reassign
											ev.target.style.height = 'auto';
											// eslint-disable-next-line no-param-reassign
											ev.target.style.height = `${25 + ev.target.scrollHeight}px`;
											const data = [
												ev.target.value,
												`${
													editor?.text[1] ? `${editor.text[1]}${ev.target.value}` : ev.target.value
												}`
											];

											throttledSaveToDraft({ text: data });
											updateSubjectField({ text: data });
											onChange(data);
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
