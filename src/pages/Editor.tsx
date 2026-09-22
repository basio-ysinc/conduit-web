import { type FormEvent, type KeyboardEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, toErrors } from "../api/client";
import type { Errors } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { ErrorMessages } from "../components/ErrorMessages";

export function Editor() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tagList, setTagList] = useState<string[]>([]);
  const [errors, setErrors] = useState<Errors | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!slug || !user) return;
    api
      .getArticle(slug)
      .then((article) => {
        setTitle(article.title);
        setDescription(article.description);
        setBody(article.body ?? "");
        setTagList(article.tagList);
      })
      .catch(() => navigate("/"));
  }, [slug, user, navigate]);

  function addTag(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const tag = tagInput.trim();
    if (tag && !tagList.includes(tag)) setTagList([...tagList, tag]);
    setTagInput("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setErrors(null);
    try {
      const article = slug
        ? await api.updateArticle(slug, { title, description, body, tagList })
        : await api.createArticle({ title, description, body, tagList });
      navigate(`/article/${article.slug}`);
    } catch (err) {
      setErrors(toErrors(err));
      setBusy(false);
    }
  }

  if (!user) return null;

  return (
    <div className="editor-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-10 offset-md-1 col-xs-12">
            <ErrorMessages errors={errors} />
            <form onSubmit={onSubmit}>
              <fieldset>
                <fieldset className="form-group">
                  <input
                    name="title"
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Article Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    name="description"
                    type="text"
                    className="form-control"
                    placeholder="What's this article about?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </fieldset>
                <fieldset className="form-group">
                  <textarea
                    name="body"
                    className="form-control"
                    rows={8}
                    placeholder="Write your article (in markdown)"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={addTag}
                  />
                  <div className="tag-list">
                    {tagList.map((tag) => (
                      <span key={tag} className="tag-default tag-pill">
                        {tag}
                      </span>
                    ))}
                  </div>
                </fieldset>
                <button
                  type="submit"
                  className="btn btn-lg pull-xs-right btn-primary"
                  disabled={busy}
                >
                  Publish Article
                </button>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
