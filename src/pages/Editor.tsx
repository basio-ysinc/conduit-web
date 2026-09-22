import { type FormEvent, type KeyboardEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as api from "../api/client";
import { errorMessages } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { ErrorMessages } from "../components/ErrorMessages";

export function Editor() {
  const { slug } = useParams<{ slug: string }>();
  const { user, token, status } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tagList, setTagList] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") navigate("/login");
  }, [status, navigate]);

  useEffect(() => {
    if (!slug || !token) return;
    api
      .getArticle(slug, token)
      .then((res) => {
        setTitle(res.article.title);
        setDescription(res.article.description);
        setBody(res.article.body ?? "");
        setTagList(res.article.tagList);
      })
      .catch(() => navigate("/"));
  }, [slug, token, navigate]);

  function addTag(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const tag = tagInput.trim();
    if (tag && !tagList.includes(tag)) setTagList([...tagList, tag]);
    setTagInput("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setErrors([]);
    try {
      const res = slug
        ? await api.updateArticle(token, slug, { title, description, body, tagList })
        : await api.createArticle(token, { title, description, body, tagList });
      navigate(`/article/${res.article.slug}`);
    } catch (err) {
      setErrors(errorMessages(err));
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
