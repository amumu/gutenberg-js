/**
 * External dependencies
 */
import { get, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import {
	IconButton,
	Spinner,
	CheckboxControl,
	withFocusReturn,
	withConstrainedTabbing,
} from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose, ifCondition } from '@wordpress/compose';

/**
 * Internal Dependencies
 */
import PostPublishButton from '../post-publish-button';
import PostPublishPanelPrepublish from './prepublish';
import PostPublishPanelPostpublish from './postpublish';

export class PostPublishPanel extends Component {
	constructor() {
		super( ...arguments );
		this.onSubmit = this.onSubmit.bind( this );
	}

	componentDidUpdate( prevProps ) {
		// Automatically collapse the publish sidebar when a post
		// is published and the user makes an edit.
		if ( prevProps.isPublished && ! this.props.isSaving && this.props.isDirty ) {
			this.props.onClose();
		}
	}

	onSubmit() {
		const { onClose, hasPublishAction, isPostTypeViewable } = this.props;
		if ( ! hasPublishAction || ! isPostTypeViewable ) {
			onClose();
		}
	}

	render() {
		const {
			forceIsDirty,
			forceIsSaving,
			isBeingScheduled,
			isPublished,
			isPublishSidebarEnabled,
			isScheduled,
			isSaving,
			onClose,
			onTogglePublishSidebar,
			PostPublishExtension,
			PrePublishExtension,
			...additionalProps
		} = this.props;
		const propsForPanel = omit( additionalProps, [ 'hasPublishAction', 'isDirty', 'isPostTypeViewable' ] );
		const isPublishedOrScheduled = isPublished || ( isScheduled && isBeingScheduled );
		const isPrePublish = ! isPublishedOrScheduled && ! isSaving;
		const isPostPublish = isPublishedOrScheduled && ! isSaving;
		return (
			<div className="editor-post-publish-panel" { ...propsForPanel }>
				<div className="editor-post-publish-panel__header">
					{ isPostPublish ? (
						<div className="editor-post-publish-panel__header-published">
							{ isScheduled ? __( 'Scheduled' ) : __( 'Published' ) }
						</div>
					) : (
						<div className="editor-post-publish-panel__header-publish-button">
							<PostPublishButton focusOnMount={ true } onSubmit={ this.onSubmit } forceIsDirty={ forceIsDirty } forceIsSaving={ forceIsSaving } />
							<span className="editor-post-publish-panel__spacer"></span>
						</div>
					) }
					<IconButton
						aria-expanded={ true }
						onClick={ onClose }
						icon="no-alt"
						label={ __( 'Close panel' ) }
					/>
				</div>
				<div className="editor-post-publish-panel__content">
					{ isPrePublish && (
						<PostPublishPanelPrepublish>
							{ PrePublishExtension && <PrePublishExtension /> }
						</PostPublishPanelPrepublish>
					) }
					{ isPostPublish && (
						<PostPublishPanelPostpublish focusOnMount={ true } >
							{ PostPublishExtension && <PostPublishExtension /> }
						</PostPublishPanelPostpublish>
					) }
					{ isSaving && ( <Spinner /> ) }
				</div>
				<div className="editor-post-publish-panel__footer">
					<CheckboxControl
						label={ __( 'Always show pre-publish checks.' ) }
						checked={ isPublishSidebarEnabled }
						onChange={ onTogglePublishSidebar }
					/>
				</div>
			</div>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const { getPostType } = select( 'core' );
		const {
			getCurrentPost,
			getEditedPostAttribute,
			isCurrentPostPublished,
			isCurrentPostScheduled,
			isEditedPostBeingScheduled,
			isEditedPostDirty,
			isSavingPost,

			// GUTENBERG JS
			getEditorSettings,
		} = select( 'core/editor' );
		const { isPublishSidebarEnabled } = select( 'core/editor' );
		const postType = getPostType( getEditedPostAttribute( 'type' ) );

		// GUTENBERG JS
		const { canPublish } = getEditorSettings();

		return {
			hasPublishAction: get( getCurrentPost(), [ '_links', 'wp:action-publish' ], false ),
			isPostTypeViewable: get( postType, [ 'viewable' ], false ),
			isBeingScheduled: isEditedPostBeingScheduled(),
			isDirty: isEditedPostDirty(),
			isPublished: isCurrentPostPublished(),
			isPublishSidebarEnabled: isPublishSidebarEnabled(),
			isSaving: isSavingPost(),
			isScheduled: isCurrentPostScheduled(),

			// GUTENBERG JS
			canPublish,
		};
	} ),
	withDispatch( ( dispatch, { isPublishSidebarEnabled } ) => {
		const { disablePublishSidebar, enablePublishSidebar } = dispatch( 'core/editor' );
		return {
			onTogglePublishSidebar: ( ) => {
				if ( isPublishSidebarEnabled ) {
					disablePublishSidebar();
				} else {
					enablePublishSidebar();
				}
			},
		};
	} ),
	withFocusReturn,
	withConstrainedTabbing,

	// GUTENBERG JS
	// added the ifCondition to enable/disable
	// the publish button according 'canPublish' setting
	ifCondition( ( { canPublish } ) => canPublish ),
] )( PostPublishPanel );
